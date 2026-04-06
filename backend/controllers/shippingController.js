//functions: getServices (from DB), calculateEstimate (calculator, No DB insertion), createOrder(calculator + DB insertion)

const pool = require("../db");
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

// ─── CALCULATE ESTIMATE  ──────────────────────────────────────────────────────────────
// Public - availabe to any website visitor
const calculateEstimate = async (req, res) => {
    /* FORM FROM CUSTOMER EXAMPLE
        {
        "serviceTypes": [1, 3],
        "origin": {
            "street_addr": "350 Fifth Ave",
            "city": "New York",
            "state": "NY",
            "country": "US",
            "postalCode": "10118"
        },
        "destination": {
            "street_addr": "233 S Wacker Dr",
            "city": "Chicago",
            "state": "IL",
            "country": "US",
            "postalCode": "60606"
        },
        "packages": [
            { "weight": 5, "length": 10, "width": 8, "height": 6, "value": 10.00 },
            { "weight": 2, "length": 4, "width": 4, "height": 4, "value": 5.00}
        ]
        }
    */
    const { origin, originIsMilitary, destination, destinationIsMilitary, packages } = req.body;
    const { selectedServices, shippingRateMap } = req;

    try {
        const totalCost = await calculateCost({ origin, originIsMilitary, destination, destinationIsMilitary, selectedServices, shippingRateMap, packages });
        res.json({ totalCost });
    } catch (err) {
        console.error("Calculate Estimate error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── CREATE ORDER  ──────────────────────────────────────────────────────────────
// Private - creates customer order after calculating shipping cost
const createOrder = async (req,res) => {
    //Input into DB: shipment: {packages, shipment_service_type, package_tracking_event}
};

module.exports = { getServices, calculateEstimate, createOrder };
