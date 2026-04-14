//functions: getServices (from DB), calculateEstimate (calculator, No DB insertion), createOrder(calculator + DB insertion)

const pool = require("../db");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
    const { origin, destination, packages } = req.body;
    const { selectedServices, shippingRateMap } = req;

    try {

        // ── Validate addresses and get coordinates ────────────────────────────
        const [originCoords, destinationCoords] = await Promise.all([
           validateAddress(origin), validateAddress(destination)]);
        // calculate total cost in ./services/shippingService  
        const totalCost = calculateCost({
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
//create tracking number, take payment, reciever name and address stored
const getQuote = async (req, res) => {
    //Input into DB: shipment: {packages, shipment_service_type, package_tracking_event}
    const { origin, destination, packages } = req.body;
    const { selectedServices, shippingRateMap } = req;

    try {
        // getting coordintates & verifying destination address to calculate total cost
        const originCoords = { lat: origin.lat, lng: origin.lng };
        const destinationCoords = await validateAddress(destination);
        const totalCost = await calculateCost({originCoords, destinationCoords, selectedServices, shippingRateMap, packages});

        res.json({totalCost});

    } catch (err) {
        const isAddressError =
            err.message?.startsWith("Could not validate address")    ||
            err.message?.startsWith("Could not geocode address")     ||
            err.message?.startsWith("Address not precise enough")    ||
            err.message?.startsWith("Unconfirmed address components");

        if (isAddressError) {
            return res.status(400).json({ message: "Destination address is invalid. Try Again."});
        }
        console.error("createOrder error:", err);
        res.status(500).json({ message: "Server error." });
    }

};

const takePayment = async (req, res) => {
    const { origin, receiverName, destination, packages } = req.body;
    const { selectedServices, shippingRateMap } = req;

    try {
        const originCoords      = { lat: origin.lat, lng: origin.lng };
        const destinationCoords = await validateAddress(destination);
        const totalCost         = calculateCost({ originCoords, destinationCoords, selectedServices, shippingRateMap, packages });

        const paymentIntent = await stripe.paymentIntents.create({
            amount:   Math.round(totalCost * 100),
            currency: "usd",
            automatic_payment_methods: { enabled: true },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        const isAddressError =
            err.message?.startsWith("Could not validate address")   ||
            err.message?.startsWith("Could not geocode address")    ||
            err.message?.startsWith("Address not precise enough")   ||
            err.message?.startsWith("Unconfirmed address components");

        if (isAddressError) {
            return res.status(400).json({ message: "Destination address is invalid. Try Again." });
        }
        console.error("takePayment error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { getServices, calculateEstimate, getQuote, takePayment };
