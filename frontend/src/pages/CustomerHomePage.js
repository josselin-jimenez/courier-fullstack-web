import { useEffect, useState } from "react";
import {
  Box, Container, Paper, Typography, CircularProgress, Alert, Divider,
  TextField, Button,
} from "@mui/material";
import { getCustomerProfile, getMyCustomerTypeRequestStatus, submitCustomerTypeRequest } from "../services/customerService";

function CustomerHomePage() {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const [requestStatus, setRequestStatus] = useState(null); // { customerType, latestRequest }
  const [businessName, setBusinessName]   = useState("");
  const [requestInfo, setRequestInfo] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError]     = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    Promise.all([getCustomerProfile(), getMyCustomerTypeRequestStatus()])
      .then(([profileData, statusData]) => {
        setProfile(profileData);
        setRequestStatus(statusData);
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!businessName.trim()) { setSubmitError("Business name is required."); return; }
    if (!requestInfo.trim()) { setSubmitError("Request reason is required."); return; }

    try {
      setSubmitLoading(true);
      await submitCustomerTypeRequest(businessName, requestInfo);
      setSubmitSuccess("Your request has been submitted and is pending review.");
      setRequestStatus((prev) => ({
        ...prev,
        latestRequest: { status: "pending", business_name: businessName, request_info: requestInfo },
      }));
      setBusinessName("");
      setRequestInfo("");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;
  if (error)   return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const isPending  = requestStatus?.latestRequest?.status === "pending";
  const isBusiness = requestStatus?.customerType === "business";

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

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Address</Typography>
        <Divider sx={{ mb: 2 }} />
        <Row label="Street"      value={profile.street_addr} />
        {profile.addr_line_2 && <Row label="Line 2"  value={profile.addr_line_2} />}
        <Row label="City"        value={profile.city} />
        <Row label="State"       value={profile.state} />
        <Row label="Postal Code" value={profile.postal_code} />
        <Row label="Country"     value={profile.country} />
      </Paper>

      {!isBusiness && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Request Business Account</Typography>
          <Divider sx={{ mb: 2 }} />

          {isPending ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Your request is pending review.
              </Alert>
              <Row label="Business Name" value={requestStatus.latestRequest.business_name} />
              <Row label="Request Info"  value={requestStatus.latestRequest.request_info} />
            </Box>
          ) : (
            <Box component="form" onSubmit={handleRequestSubmit}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Submit a request to upgrade your account to a business account.
              </Typography>

              {submitError   && <Alert severity="error"   sx={{ mb: 2 }}>{submitError}</Alert>}
              {submitSuccess && <Alert severity="success" sx={{ mb: 2 }}>{submitSuccess}</Alert>}

              <TextField
                fullWidth
                label="Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Provide proof of business for our team to review:"
                value={requestInfo}
                onChange={(e) => setRequestInfo(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={submitLoading}
                sx={{ backgroundColor: "#215bb1" }}
              >
                {submitLoading ? "Submitting..." : "Submit Request"}
              </Button>
            </Box>
          )}
        </Paper>
      )}
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