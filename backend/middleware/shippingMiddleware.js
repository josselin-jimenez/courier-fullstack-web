// middleware/shippingMiddleware.js

const pool = require("../db");

// reusable shipment service constraint validation & rate checking for shipping calculations
const validateShipment = async (req, res, next) => {
    const { serviceTypes, packages } = req.body;

    if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
        return res.status(400).json({ message: "At least one service type is required." });
    }
    if (!Array.isArray(packages) || packages.length === 0) {
        return res.status(400).json({ message: "At least one package is required." });
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

    const [shippingRates] = await pool.execute(
        `SELECT rate_type, rate_amount FROM shipping_rates`
    );

    const shippingRateMap = Object.fromEntries(shippingRates.map(r => [r.rate_type, parseFloat(r.rate_amount)]));

    const requiredRates = ["weight", "distance", "handling_fee", "insurance"];
    const missingRates = requiredRates.filter(r => shippingRateMap[r] === undefined);
    if (missingRates.length > 0) {
        return res.status(500).json({ message: `Missing shipping rates: ${missingRates.join(", ")}` });
    }

    // Attach to req so controllers can use them without re-querying
    req.shippingRateMap = shippingRateMap;
    req.selectedServices = selectedServices;
    next();
};

module.exports = { validateShipment };
