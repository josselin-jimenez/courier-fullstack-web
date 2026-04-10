import { useEffect, useState } from "react";
import {
  Box, Container, Paper, Typography, CircularProgress, Alert, Divider,
} from "@mui/material";
import api from "../api/axios";

function CustomerHomePage() {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    api.get("/api/customer/me")
      .then((res) => setProfile(res.data))
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;
  if (error)   return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome, {profile.name}
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Account</Typography>
        <Divider sx={{ mb: 2 }} />
        <Row label="Name"         value={profile.name} />
        <Row label="Email"        value={profile.email} />
        <Row label="Phone"        value={profile.phone_num} />
        <Row label="Account Type" value={profile.cust_type} />
        {profile.business_name && <Row label="Business" value={profile.business_name} />}
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Address</Typography>
        <Divider sx={{ mb: 2 }} />
        <Row label="Street"      value={profile.street_addr} />
        {profile.addr_line_2 && <Row label="Line 2"  value={profile.addr_line_2} />}
        <Row label="City"        value={profile.city} />
        <Row label="State"       value={profile.state} />
        <Row label="Postal Code" value={profile.postal_code} />
        <Row label="Country"     value={profile.country} />
      </Paper>
    </Container>
  );
}

function Row({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight="medium">{value}</Typography>
    </Box>
  );
}

export default CustomerHomePage;