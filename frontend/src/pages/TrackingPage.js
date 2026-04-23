import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { getTracking } from "../services/trackingService";

function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingData, setTrackingData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTrackingData(null);

    const cleaned = trackingNumber.trim().toUpperCase();
    if (!cleaned) {
      setError("Please enter a tracking number.");
      return;
    }

    try {
      setLoading(true);
      const data = await getTracking(cleaned);
      setTrackingData(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch tracking info.");
    } finally {
      setLoading(false);
    }
  };

  const summary = trackingData?.summary;

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
          Track Your Shipment
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Enter your tracking number to see the latest shipment updates.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <TextField
            label="Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchIcon />}
            disabled={loading}
            sx={{ minWidth: 180 }}
          >
            {loading ? "Searching..." : "Track Package"}
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {summary && (
          <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Shipment Summary
            </Typography>

            <Typography><strong>Tracking #:</strong> {summary.tracking_number}</Typography>
            <Typography>
              <strong>Destination:</strong>{" "}
              {summary.destination.city}, {summary.destination.state}, {summary.destination.country}
            </Typography>
            <Typography sx={{ mt: 2 }}>
              <strong>Latest Status:</strong> {summary.latest_status.status_name}
            </Typography>
            <Typography>
              <strong>Status Type:</strong> {summary.latest_status.status_type}
            </Typography>
            <Typography>
              <strong>Last Updated:</strong>{" "}
              {new Date(summary.latest_status.event_time).toLocaleString()}
            </Typography>
            <Typography>
              <strong>Location:</strong>{" "}
              {summary.latest_status.event_city}, {summary.latest_status.event_state}, {summary.latest_status.event_country}
            </Typography>
          </Paper>
        )}

        {trackingData?.packages?.map((pkg) => (
          <Paper key={pkg.package_id} variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Package {pkg.pkg_no} of {pkg.pkg_total}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              {pkg.history.map((event, index) => (
                <Paper
                  key={`${pkg.package_id}-${index}`}
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2, backgroundColor: "#fafafa" }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 1 }}>
                    <Typography fontWeight="bold">{event.status_name}</Typography>
                    <Chip label={event.status_type} color="primary" variant="outlined" />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {new Date(event.event_time).toLocaleString()}
                  </Typography>

                  <Typography sx={{ mt: 1 }}>
                    <strong>Location:</strong> {event.event_city}, {event.event_state}, {event.event_country}
                  </Typography>

                  <Typography>
                    <strong>Condition:</strong> {event.pkg_condition_status}
                  </Typography>

                  {event.pkg_condition_info && (
                    <Typography>
                      <strong>Condition Info:</strong> {event.pkg_condition_info}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          </Paper>
        ))}
      </Paper>
    </Container>
  );
}

export default TrackingPage;