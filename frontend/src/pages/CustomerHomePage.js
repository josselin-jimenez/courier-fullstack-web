import { useEffect, useState } from "react";
import {
  Box, Container, Paper, Typography, CircularProgress, Alert, Divider,
  TextField, Button,
} from "@mui/material";
import {
  getCustomerProfile,
  getMyCustomerTypeRequestStatus,
  submitCustomerTypeRequest,
  updateCustomerProfile,
  updateCustomerAddress,
} from "../services/customerService";

function CustomerHomePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Business request state
  const [requestStatus, setRequestStatus] = useState(null);
  const [businessName, setBusinessName]   = useState("");
  const [requestInfo, setRequestInfo]     = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError]     = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm]       = useState({ name: "", email: "", phone: "" });
  const [profileSaving, setProfileSaving]   = useState(false);
  const [profileError, setProfileError]     = useState("");

  // Address edit state
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressForm, setAddressForm]       = useState({ streetAddr: "", unit: "", city: "", state: "", postalCode: "", country: "" });
  const [addressSaving, setAddressSaving]   = useState(false);
  const [addressError, setAddressError]     = useState("");

  useEffect(() => {
    Promise.all([getCustomerProfile(), getMyCustomerTypeRequestStatus()])
      .then(([profileData, statusData]) => {
        setProfile(profileData);
        setRequestStatus(statusData);
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const handleEditProfile = () => {
    setProfileForm({ name: profile.name, email: profile.email, phone: profile.phone_num });
    setProfileError("");
    setEditingProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    try {
      setProfileSaving(true);
      await updateCustomerProfile(profileForm.name, profileForm.email, profileForm.phone);
      setProfile((prev) => ({ ...prev, name: profileForm.name, email: profileForm.email, phone_num: profileForm.phone }));
      setEditingProfile(false);
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleEditAddress = () => {
    setAddressForm({
      streetAddr: profile.street_addr,
      unit:       profile.addr_line_2 || "",
      city:       profile.city,
      state:      profile.state,
      postalCode: profile.postal_code || "",
      country:    profile.country,
    });
    setAddressError("");
    setEditingAddress(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressError("");
    try {
      setAddressSaving(true);
      await updateCustomerAddress(
        addressForm.streetAddr,
        addressForm.unit || null,
        addressForm.city,
        addressForm.state,
        addressForm.country,
        addressForm.postalCode || null,
      );
      setProfile((prev) => ({
        ...prev,
        street_addr:  addressForm.streetAddr,
        addr_line_2:  addressForm.unit || null,
        city:         addressForm.city,
        state:        addressForm.state,
        postal_code:  addressForm.postalCode || null,
        country:      addressForm.country,
      }));
      setEditingAddress(false);
    } catch (err) {
      setAddressError(err.response?.data?.message || "Failed to update address.");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    if (!businessName.trim()) { setSubmitError("Business name is required."); return; }
    if (!requestInfo.trim())  { setSubmitError("Request reason is required."); return; }
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
  const isBusiness = requestStatus?.customerType === "Business";

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome, {profile.name}
      </Typography>

      {/* ── Personal Info Card ── */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h6" fontWeight="bold">Account</Typography>
          {!editingProfile && (
            <Button size="small" onClick={handleEditProfile}>Edit</Button>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />

        {editingProfile ? (
          <Box component="form" onSubmit={handleSaveProfile}>
            {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}
            <TextField fullWidth label="Name"  value={profileForm.name}
              onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="Email" value={profileForm.email}
              onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="Phone" value={profileForm.phone}
              onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button type="submit" variant="contained" disabled={profileSaving} sx={{ backgroundColor: "#215bb1" }}>
                {profileSaving ? "Saving..." : "Save"}
              </Button>
              <Button variant="outlined" onClick={() => setEditingProfile(false)} disabled={profileSaving}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Row label="Name"         value={profile.name} />
            <Row label="Email"        value={profile.email} />
            <Row label="Phone"        value={profile.phone_num} />
            <Row label="Account Type" value={profile.cust_type} />
            {profile.business_name && <Row label="Business" value={profile.business_name} />}
          </>
        )}
      </Paper>

      {/* ── Address Card ── */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h6" fontWeight="bold">Address</Typography>
          {!editingAddress && (
            <Button size="small" onClick={handleEditAddress}>Edit</Button>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />

        {editingAddress ? (
          <Box component="form" onSubmit={handleSaveAddress}>
            {addressError && <Alert severity="error" sx={{ mb: 2 }}>{addressError}</Alert>}
            <TextField fullWidth label="Street Address" value={addressForm.streetAddr}
              onChange={(e) => setAddressForm((p) => ({ ...p, streetAddr: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="Unit / Apt (optional)" value={addressForm.unit}
              onChange={(e) => setAddressForm((p) => ({ ...p, unit: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="City" value={addressForm.city}
              onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="State" value={addressForm.state}
              onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="Postal Code (optional)" value={addressForm.postalCode}
              onChange={(e) => setAddressForm((p) => ({ ...p, postalCode: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="Country" value={addressForm.country}
              onChange={(e) => setAddressForm((p) => ({ ...p, country: e.target.value }))} sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button type="submit" variant="contained" disabled={addressSaving} sx={{ backgroundColor: "#215bb1" }}>
                {addressSaving ? "Validating address..." : "Save"}
              </Button>
              <Button variant="outlined" onClick={() => setEditingAddress(false)} disabled={addressSaving}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Row label="Street"      value={profile.street_addr} />
            {profile.addr_line_2 && <Row label="Line 2"       value={profile.addr_line_2} />}
            <Row label="City"        value={profile.city} />
            <Row label="State"       value={profile.state} />
            <Row label="Postal Code" value={profile.postal_code} />
            <Row label="Country"     value={profile.country} />
          </>
        )}
      </Paper>

      {/* ── Business Request Card ── */}
      {!isBusiness && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Request Business Account</Typography>
          <Divider sx={{ mb: 2 }} />
          {isPending ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>Your request is pending review.</Alert>
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
              <TextField fullWidth label="Business Name" value={businessName}
                onChange={(e) => setBusinessName(e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth multiline rows={4}
                label="Provide proof of business for our team to review:"
                value={requestInfo} onChange={(e) => setRequestInfo(e.target.value)} sx={{ mb: 2 }} />
              <Button type="submit" variant="contained" disabled={submitLoading} sx={{ backgroundColor: "#215bb1" }}>
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
