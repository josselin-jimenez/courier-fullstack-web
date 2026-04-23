import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Divider,
  Chip,
} from "@mui/material";
import {
  getPackageStatuses,
  searchPackageByTracking,
  submitDriverScan,
  getVehicles,
} from "../services/scanService";

function DriverScanPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [packages, setPackages] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    getPackageStatuses("driver")
      .then(setStatuses)
      .catch(() => setError("Failed to load driver statuses."));

    getVehicles()
      .then(setVehicles)
      .catch(() => setError("Failed to load vehicles."));
  }, []);

  const handleSearch = async () => {
    setError("");
    setSuccess("");
    setPackages([]);
    setSelectedPackageId("");
    setSelectedStatus("");

    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number.");
      return;
    }

    try {
      setLoadingSearch(true);
      const data = await searchPackageByTracking(trackingNumber);
      setPackages(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to search for package.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!selectedPackageId || !selectedStatus) {
      setError("Please select a package and a status.");
      return;
    }

    try {
      setLoadingSubmit(true);
      const response = await submitDriverScan(
        selectedPackageId,
        selectedStatus,
        selectedVehicleId || null
      );
      setSuccess(response.message || "Package scanned successfully.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to scan package.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Driver Scan Page
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Search by tracking number, select a package, assign a transit/delivery status, and optionally attach a vehicle.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
            fullWidth
          />
          <Button variant="contained" onClick={handleSearch} disabled={loadingSearch}>
            {loadingSearch ? "Searching..." : "Search"}
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {packages.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Matching Packages
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Package</InputLabel>
            <Select
              value={selectedPackageId}
              label="Select Package"
              onChange={(e) => setSelectedPackageId(e.target.value)}
            >
              {packages.map((pkg) => (
                <MenuItem key={pkg.package_id} value={pkg.package_id}>
                  Package #{pkg.package_id} — {pkg.current_status || "No status yet"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Select Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statuses.map((status) => (
                <MenuItem key={status.status_no} value={status.status_no}>
                  {status.status_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Vehicle (Optional)</InputLabel>
            <Select
              value={selectedVehicleId}
              label="Select Vehicle (Optional)"
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {vehicles.map((vehicle) => (
                <MenuItem key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                  {vehicle.vehicle_transit_identifier} — {vehicle.vehicle_type} ({vehicle.vehicle_status})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button variant="contained" onClick={handleSubmit} disabled={loadingSubmit}>
            {loadingSubmit ? "Submitting..." : "Submit Driver Scan"}
          </Button>

          <Box sx={{ mt: 4 }}>
            {packages.map((pkg) => (
              <Paper key={pkg.package_id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography fontWeight="bold">
                  Tracking #: {pkg.tracking_number}
                </Typography>
                <Typography>Package ID: {pkg.package_id}</Typography>
                <Typography>
                  Destination: {pkg.dest_city}, {pkg.dest_state}, {pkg.dest_country}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={pkg.current_status || "No Current Status"}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        </Paper>
      )}
    </Container>
  );
}

export default DriverScanPage;