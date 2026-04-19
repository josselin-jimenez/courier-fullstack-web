//functions: getServices (from DB), calculateEstimate (calculator, No DB insertion), createOrder(calculator + DB insertion)

const crypto = require("crypto");
const pool   = require("../db");
const { validateAddress } = require("../middleware/addressMiddleware");
const { calculateCost }   = require("../services/shippingService");

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

// ─── GET QUOTE  ───────────────────────────────────────────────────────────
// Private - calculates shipping cost according to customers saved address
const getQuote = async (req, res) => {
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
 
// ─── CREATE SHIPMENT  ────────────────────────────────────────────────────────
// Private - inserts payment record then shipment, gated on payment succeeding
const createShipment = async (req, res) => {
    const { origin, receiverName, destination, packages } = req.body;
    const { selectedServices, shippingRateMap } = req;

    try {
        // Recalculate cost on server-side for safety
        const originCoords      = { lat: origin.lat, lng: origin.lng };
        const destinationCoords = await validateAddress(destination);
        const totalCost         = calculateCost({ originCoords, destinationCoords, selectedServices, shippingRateMap, packages });

        // Get customer id
        const [[customer]] = await pool.execute(
            `SELECT cust_id, cust_addr FROM customer WHERE cust_account = ?`,
            [req.user.id]
        );
        if (!customer) return res.status(404).json({ message: "Customer not found." });
        // create tracking number
        const trackingNumber = crypto.randomBytes(8).toString("hex").toUpperCase();
        const hasInsurance   = selectedServices.some(s => s.service_name === "Insurance");
        const insurAmt       = hasInsurance
            ? Math.round(packages.reduce((sum, pkg) => sum + (parseFloat(pkg.value) || 0), 0))
            : 0;

        const custId = customer.cust_id;
        const originId = customer.cust_addr;

        // ── DB Transaction ───────────────────────────────────────────────────────
        const conn = await pool.getConnection();
        await conn.execute(`SET @current_employee_id = ?`, [process.env.SYSTEM_EMPLOYEE_ID]);
        try {
            await conn.beginTransaction();

            // Insert payment, shipment creation is gated on this succeeding (pretty much always will)
            const [paymentResult] = await conn.execute(
                `INSERT INTO payment (date_paid, total_paid, payment_method)
                 VALUES (CURDATE(), ?, 'credit')`,
                [totalCost]
            ); 

            // see if address already in table, select based on whether unit was entered by user
            const unit = destination.unit || null;
            const[existingAddress] = await conn.execute(
                unit
                    ? "SELECT address_id FROM address WHERE street_addr = ? AND addr_line_2 = ? AND city = ? AND postal_code = ? AND country = ?"
                    : "SELECT address_id FROM address WHERE street_addr = ? AND addr_line_2 IS NULL AND city = ? AND postal_code = ? AND country = ?",
                unit
                    ? [destination.streetAddr, unit, destination.city, destination.postalCode, destination.country]
                    : [destination.streetAddr, destination.city, destination.postalCode, destination.country]
                );
                // if not, enter new address
                let addressId;
                if (existingAddress.length > 0) {
                addressId = existingAddress[0].address_id;
                } else {
                const [addressResult] = await conn.execute( 
                    "INSERT INTO address (street_addr, addr_line_2, city, state, postal_code, country, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                    destination.streetAddr, 
                    destination.unit || null, 
                    destination.city, 
                    destination.state, 
                    destination.postalCode ? destination.postalCode.toUpperCase() : null, 
                    destination.country,
                    destinationCoords.lat, 
                    destinationCoords.lng 
                    ]
                );
                addressId = addressResult.insertId;
                }

            // Insert shipment
            const [shipmentResult] = await conn.execute(
                `INSERT INTO shipment (tracking_number, for_customer, shipment_transaction, origin_addr, receiver_name, receiver_addr, insur_amt)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    trackingNumber,
                    custId,
                    paymentResult.insertId,
                    originId,
                    receiverName,
                    addressId,
                    insurAmt,
                ]
            );

            // Insert all selected services into junction table
            for (const service of selectedServices) {
                await conn.execute(
                    `INSERT INTO shipment_service_type (shipment_id, service_type_no) VALUES (?, ?)`,
                    [shipmentResult.insertId, service.service_type_no]
                );
            }

            // Insert packages
            for (const pkg of packages) {
                await conn.execute(
                    `INSERT INTO package (part_of_shipment, pkg_weight, pkg_length, pkg_width, pkg_height, pkg_value)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        shipmentResult.insertId,
                        Math.round(parseFloat(pkg.weight)),
                        Math.round(parseFloat(pkg.length)),
                        Math.round(parseFloat(pkg.width)),
                        Math.round(parseFloat(pkg.height)),
                        pkg.value ? parseFloat(pkg.value) : null,
                    ]
                );
            }

            await conn.commit();
            res.json({ trackingNumber, totalCost });

        } catch (txErr) {
            await conn.rollback();
            throw txErr;
        } finally {
            conn.release();
        }

    } catch (err) {
        const isAddressError =
            err.message?.startsWith("Could not validate address")   ||
            err.message?.startsWith("Could not geocode address")    ||
            err.message?.startsWith("Address not precise enough")   ||
            err.message?.startsWith("Unconfirmed address components");

        if (isAddressError) {
            return res.status(400).json({ message: "Destination address is invalid. Try Again." });
        }
        console.error("createShipment error:", err);
        res.status(500).json({ message: "Server error." });
    }
};
// Trigger creates first package tracking event

module.exports = { getServices, calculateEstimate, getQuote, createShipment };
