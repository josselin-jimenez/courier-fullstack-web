// DriverHomePage
import { useEffect, useState } from "react";
import {
  Box, Container, Paper, Typography, CircularProgress, Alert,
  Divider, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip,
} from "@mui/material";
import LocalShippingIcon  from "@mui/icons-material/LocalShipping";
import QrCodeScannerIcon  from "@mui/icons-material/QrCodeScanner";
import LocationOnIcon     from "@mui/icons-material/LocationOn";
import { getDriverDashboard } from "../services/employeeService";

const GREEN = "#2e7d32";

const statusColors = {
  "Pre-Processing": "default",
  "Processing":     "warning",
  "Transit":        "info",
  "Delivery":       "success",
};

function StatCard({ icon, label, value }) {
  return (
    <Paper elevation={2} sx={{ p: 3, textAlign: "center", borderRadius: 3, flex: "1 1 160px" }}>
      <Box sx={{ color: GREEN, mb: 1 }}>{icon}</Box>
      <Typography variant="h4" fontWeight="bold">{value}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

function formatDateTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function DriverHomePage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getDriverDashboard()
      .then(setData)
      .catch(() => setError("Failed to load dashboard. Contact your administrator."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;
  if (error)   return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const { employee, stats, recent_events } = data;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Driver Dashboard
      </Typography>

      {/* Facility info */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <LocationOnIcon sx={{ color: GREEN }} />
          <Typography variant="h6" fontWeight="bold">My Facility</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography fontWeight="medium">{employee.facility_name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
          {employee.department_type}
        </Typography>
        <Typography variant="body2" color="text.secondary">{employee.facility_address}</Typography>
      </Paper>

      {/* Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <StatCard
          icon={<QrCodeScannerIcon sx={{ fontSize: 36 }} />}
          label="Total scans"
          value={stats.total_scans}
        />
      </Box>

      {/* Recent scans */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <LocalShippingIcon sx={{ color: GREEN }} />
          <Typography variant="h6" fontWeight="bold">Recent Package Scans</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {recent_events.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <QrCodeScannerIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">No package scans recorded yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f1f8f1" }}>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Tracking #</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Vehicle</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Weight (lbs)</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recent_events.map((e) => (
                  <TableRow key={e.pkg_tracking_event_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight="bold" color={GREEN}>
                        {e.tracking_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={e.status_name}
                        color={statusColors[e.status_type] ?? "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{e.location_city ? `${e.location_city}, ${e.location_state}` : "—"}</TableCell>
                    <TableCell>{e.vehicle_id ?? "—"}</TableCell>
                    <TableCell>{e.pkg_weight} lbs</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                      {formatDateTime(e.event_time)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
}

export default DriverHomePage;