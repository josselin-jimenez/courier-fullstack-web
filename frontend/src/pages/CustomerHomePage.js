import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import {
  getMyCustomerTypeRequestStatus,
  submitCustomerTypeRequest
} from "../services/customerTypeRequestService";

function CustomerHomePage() {
  const [requestReason, setRequestReason] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [latestRequest, setLatestRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadRequestStatus = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await getMyCustomerTypeRequestStatus();
      setCustomerType(data.customerType);
      setLatestRequest(data.latestRequest);
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message || "Failed to load customer request status."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequestStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!requestReason.trim()) {
      setErrorMsg("Please enter a reason for the business type request.");
      return;
    }

    try {
      setSubmitting(true);
      const data = await submitCustomerTypeRequest(requestReason);
      setSuccessMsg(data.message);
      setRequestReason("");
      await loadRequestStatus();
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message || "Failed to submit request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const hasPendingRequest = latestRequest?.status === "pending";
  const alreadyBusiness = customerType === "business";

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 5, px: 2 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Customer Home
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          {successMsg && <Alert severity="success">{successMsg}</Alert>}

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Current Customer Status
              </Typography>
              <Typography>
                Current type: <strong>{customerType || "unknown"}</strong>
              </Typography>

              {latestRequest ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    Latest Request
                  </Typography>
                  <Typography>Status: {latestRequest.status}</Typography>
                  <Typography>
                    Requested Type: {latestRequest.requested_type}
                  </Typography>
                  <Typography>
                    Reason: {latestRequest.request_reason}
                  </Typography>
                  <Typography>
                    Submitted At:{" "}
                    {new Date(latestRequest.created_at).toLocaleString()}
                  </Typography>
                </Box>
              ) : (
                <Typography sx={{ mt: 2 }}>
                  No customer type change requests submitted yet.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Request Change to Business Customer
              </Typography>

              {alreadyBusiness ? (
                <Alert severity="info">
                  Your account is already a business customer.
                </Alert>
              ) : hasPendingRequest ? (
                <Alert severity="warning">
                  You already have a pending request. Wait for it to be reviewed.
                </Alert>
              ) : (
                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="Why should your account be changed to business?"
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ mt: 2 }}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}

export default CustomerHomePage;