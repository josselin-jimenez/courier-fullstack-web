//functions: getServices (from DB), calculateEstimate (calculator, No DB insertion), createOrder(calculator + DB insertion)

const pool = require("../db");
const { validateAddress, validateMilitaryAddress } = require("../middleware/addressMiddleware");
const { calculateCost } = require("../services/shippingService");

// ─── GET SERVICES ────────────────────────────────────────────────────────────
// Public — returns all service types and their base costs from the DB
const getServices = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT service_type_no, service_category, service_name, base_cost FROM service_type"
    );
    res.json(rows);
  } catch (err) {
    console.error("getServices error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── CALCULATE ESTIMATE  ─────────────────────────────────────────────────────
// Public - available to any website visitor
const calculateEstimate = async (req, res) => {
    const { origin, originIsMilitary, destination, destinationIsMilitary, serviceTypes, packages } = req.body;

    try {
        // ── Package validation ────────────────────────────────────────────────
        if (!Array.isArray(packages) || packages.length === 0) {
            return res.status(400).json({ message: "At least one package is required." });
        }
        const invalidPackage = packages.some(pkg =>
            !pkg.weight || !pkg.length || !pkg.width || !pkg.height ||
            isNaN(parseFloat(pkg.weight)) || isNaN(parseFloat(pkg.length)) ||
            isNaN(parseFloat(pkg.width))  || isNaN(parseFloat(pkg.height))
        );
        if (invalidPackage) {
            return res.status(400).json({ message: "All packages must have valid numeric weight and dimensions." });
        }

        // ── Address field presence check ──────────────────────────────────────
        const addressFields = ["streetAddr", "city", "country", "postalCode"];
        if (!originIsMilitary && addressFields.some(f => !origin?.[f])) {
            return res.status(400).json({ message: "Please fill all origin address fields." });
        }
        if (!destinationIsMilitary && addressFields.some(f => !destination?.[f])) {
            return res.status(400).json({ message: "Please fill all destination address fields." });
        }

        // ── Query DB for selected service types ───────────────────────────────
        if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
            return res.status(400).json({ message: "Incorrect amount of service types" });
        }
        const placeholders = serviceTypes.map(() => "?").join(", ");
        const [selectedServices] = await pool.execute(
            `SELECT service_type_no, service_category, service_name, base_cost
            FROM service_type WHERE service_type_no IN (${placeholders})`,
            serviceTypes
        );

        const timeServices   = selectedServices.filter(s => s.service_category === "time");
        const regionServices = selectedServices.filter(s => s.service_category === "region");
        const addOnServices  = selectedServices.filter(s => s.service_category === "add-on");

        // ── Service constraints ───────────────────────────────────────────────
        if (timeServices.length !== 1) {
            return res.status(400).json({ message: "Exactly one time service type is required." });
        }
        if (regionServices.length !== 1) {
            return res.status(400).json({ message: "Exactly one region service type is required." });
        }
        const insurance = addOnServices.find(s => s.service_name === "Insurance");
        if (insurance && packages.some(pkg => !pkg.value)) {
            return res.status(400).json({ message: "Package value required for insurance." });
        }

        // ── Region constraints ────────────────────────────────────────────────
        const regionService = selectedServices.find(s => s.service_category === "region");
        if (regionService?.service_name === "US" && (origin.country !== "US" || destination.country !== "US")) {
            return res.status(400).json({ message: "Region service must be changed to international." });
        }
        if (regionService?.service_name === "International" && origin.country === "US" && destination.country === "US") {
            return res.status(400).json({ message: "Region service must be changed to domestic." });
        }

        // ── Military constraints ──────────────────────────────────────────────
        if (!originIsMilitary && !destinationIsMilitary && regionService?.service_name.startsWith("Military")) {
            return res.status(400).json({ message: "Military address not entered for service region of type military."})
        }
        if ((originIsMilitary || destinationIsMilitary) && !regionService?.service_name.startsWith("Military")) {
            return res.status(400).json({ message: "If origin/destination is military, change service region to appropriate military type." });
        }
        if ((!originIsMilitary && destinationIsMilitary && origin.country !== "US")
            || (!destinationIsMilitary && originIsMilitary && destination.country !== "US")) {
            return res.status(400).json({ message: "Military shipping service only available between military & non-military US addresses." });
        }

        // Military state constraint
        if (regionService?.service_name.startsWith("Military")) {
            const expectedState = regionService.service_name.split(" - ")[1]; // Military - AE -> just AE
            if (originIsMilitary && origin.state !== expectedState) {
                return res.status(400).json({ message: `State must be ${expectedState} for selected military service.` });
            }
            if (destinationIsMilitary && destination.state !== expectedState) {
                return res.status(400).json({ message: `State must be ${expectedState} for selected military service.` });
            }
        }

        // ── Query DB for shipping rates ───────────────────────────────────────
        const [shippingRates] = await pool.execute(
            `SELECT rate_type, rate_amount FROM shipping_rates`
        );
        const shippingRateMap = Object.fromEntries(shippingRates.map(r => [r.rate_type, parseFloat(r.rate_amount)]));

        const requiredRates = ["weight", "distance", "handling_fee", "insurance"];
        const missingRates = requiredRates.filter(r => shippingRateMap[r] === undefined);
        if (missingRates.length > 0) {
            return res.status(500).json({ message: `Missing shipping rates: ${missingRates.join(", ")}` });
        }

        // Military street, city, and postal code regex validation
        if (originIsMilitary) validateMilitaryAddress(origin);
        if (destinationIsMilitary) validateMilitaryAddress(destination);

        // ── Validate addresses and get coordinates ────────────────────────────
        // Military addresses validated separately and use a flat distance rate
        const [originCoords, destinationCoords] = await Promise.all([
            originIsMilitary      ? Promise.resolve(null) : validateAddress(origin),
            destinationIsMilitary ? Promise.resolve(null) : validateAddress(destination),
        ]);
        // calculate total cost in ./services/shippingService  
        const totalCost = await calculateCost({
            originIsMilitary, originCoords,
            destinationIsMilitary, destinationCoords,
            selectedServices, shippingRateMap, packages
        });

        res.json({ totalCost });

    } catch (err) {
        const isAddressError =
            err.message?.startsWith("Could not validate address")    ||
            err.message?.startsWith("Could not geocode address")     ||
            err.message?.startsWith("Address not precise enough")    ||
            err.message?.startsWith("Unconfirmed address components");
        const militaryAddressError =
            err.message?.startsWith("Country must be US")            ||
            err.message?.startsWith("City must be a valid military") ||
            err.message?.startsWith("State must be a valid military") ||
            err.message?.startsWith("Invalid military street address") ||
            err.message?.startsWith("Invalid military postal code");

        if (isAddressError) {
            return res.status(400).json({ message: "An address that was input is invalid. Try Again."});
        }
        if (militaryAddressError) {
            return res.status(400).json({ message: err.message });
        }
        console.error("Calculate Estimate error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── CREATE ORDER  ───────────────────────────────────────────────────────────
// Private - creates customer order after calculating shipping cost
const createOrder = async (req, res) => {
    //Input into DB: shipment: {packages, shipment_service_type, package_tracking_event}
};

module.exports = { getServices, calculateEstimate, createOrder };
