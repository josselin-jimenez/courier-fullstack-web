const pool = require("../db");


const verifyShipment = async (req, res, next) => {
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
        const addressFields = ["streetAddr", "city", "state", "country", "postalCode"];
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

        // attach results to req so calculateEstimate can use them
        req.selectedServices = selectedServices;
        req.shippingRateMap  = shippingRateMap;
        next();

    } catch (err) {
        console.error("verifyShipment error: ", err);
        res.status(500).json({ message: "Server error." });
    }
};

const attachCustomerOrigin = async (req, res, next) => {
    try {
        const [addressResult] = await pool.execute(
            `SELECT a.street_addr, a.addr_line_2, a.city, a.state, a.postal_code, a.country, a.latitude, a.longitude
            FROM customer AS c
            JOIN address AS a ON c.cust_addr = a.address_id
            WHERE c.cust_account = ? `,
            [req.user.id]
        );

        req.body.origin = {
            streetAddr: addressResult[0].street_addr,
            unit:       addressResult[0].addr_line_2,
            city:       addressResult[0].city,
            state:      addressResult[0].state,
            postalCode: addressResult[0].postal_code,
            country:    addressResult[0].country,
            lat:        addressResult[0].latitude,
            lng:        addressResult[0].longitude,
        };

        //console.log(JSON.stringify(req.body.origin));
        next();

    } catch (err) {
        console.error("getCustomerOrigin: ", err);
        res.status(500).json({ message: "Server error."});
    }
};
module.exports = { verifyShipment, attachCustomerOrigin };