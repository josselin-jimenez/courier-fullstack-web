const pool = require("../db");

const getTrackingByNumber = async (req, res) => {
  const { trackingNumber } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT *
       FROM shipment_tracking
       WHERE tracking_number = ?
       ORDER BY pkg_no ASC, event_time DESC`,
      [trackingNumber.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Tracking number not found." });
    }

    const latestEvent = rows.reduce((latest, row) => {
      if (!latest) return row;
      return new Date(row.event_time) > new Date(latest.event_time) ? row : latest;
    }, null);

    const packageMap = new Map();

    for (const row of rows) {
      if (!packageMap.has(row.package_id)) {
        packageMap.set(row.package_id, {
          package_id: row.package_id,
          pkg_no: row.pkg_no,
          pkg_total: row.pkg_total,
          history: [],
        });
      }

      packageMap.get(row.package_id).history.push({
        event_time: row.event_time,
        status_type: row.status_type,
        status_name: row.status_name,
        pkg_condition_status: row.pkg_condition_status,
        pkg_condition_info: row.pkg_condition_info,
        event_city: row.event_city,
        event_state: row.event_state,
        event_country: row.event_country,
      });
    }

    res.json({
      summary: {
        tracking_number: latestEvent.tracking_number,
        destination: {
          city: latestEvent.dest_city,
          state: latestEvent.dest_state,
          country: latestEvent.dest_country,
        },
        latest_status: {
          event_time: latestEvent.event_time,
          status_type: latestEvent.status_type,
          status_name: latestEvent.status_name,
          event_city: latestEvent.event_city,
          event_state: latestEvent.event_state,
          event_country: latestEvent.event_country,
        },
      },
      packages: Array.from(packageMap.values()),
    });
  } catch (err) {
    console.error("getTrackingByNumber error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { getTrackingByNumber };