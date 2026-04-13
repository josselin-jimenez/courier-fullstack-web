//functions: getServices (from DB), calculateEstimate (calculator, No DB insertion), createOrder(calculator + DB insertion)

const pool = require("../db");
const { validateAddress } = require("../middleware/addressMiddleware");
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
    const { origin, destination, serviceTypes, packages } = req.body;

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
        if (addressFields.some(f => !origin?.[f])) {
            return res.status(400).json({ message: "Please fill all origin address fields." });
        }
        if (addressFields.some(f => !destination?.[f])) {
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

        // ── Validate addresses and get coordinates ────────────────────────────
        const [originCoords, destinationCoords] = await Promise.all([
           validateAddress(origin), validateAddress(destination)]);
        // calculate total cost in ./services/shippingService  
        const totalCost = await calculateCost({
           originCoords, destinationCoords, selectedServices, shippingRateMap, packages
        });

        res.json({ totalCost });

    } catch (err) {
        const isAddressError =
            err.message?.startsWith("Could not validate address")    ||
            err.message?.startsWith("Could not geocode address")     ||
            err.message?.startsWith("Address not precise enough")    ||
            err.message?.startsWith("Unconfirmed address components");

        if (isAddressError) {
            return res.status(400).json({ message: "An address that was input is invalid. Try Again."});
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
