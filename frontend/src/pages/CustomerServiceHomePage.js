import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Stack
} from "@mui/material";
import {
  getAllCustomerTypeRequests,
  reviewCustomerTypeRequest
} from "../services/customerService";

function CustomerServiceHomePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAllCustomerTypeRequests();
      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReview = async (requestId, status) => {
    try {
      setActionMessage("");
      await reviewCustomerTypeRequest(requestId, status);
      setActionMessage(`Request ${status} successfully.`);
      await loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update request.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Customer Service Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Review customer type requests in earliest-submitted order.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {actionMessage && <Alert severity="success" sx={{ mb: 2 }}>{actionMessage}</Alert>}

      {requests.length === 0 ? (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography>No customer type requests found.</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {requests.map((request) => (
            <Paper key={request.request_id} elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Request #{request.request_id}
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Row label="Submitted By" value={request.name} />
              <Row label="Email" value={request.email} />
              <Row label="Phone" value={request.phone_num} />
              <Row label="Current Type" value={request.cust_type} />
              <Row label="Requested Type" value={request.requested_type} />
              <Row label="Business Name" value={request.business_name} />
              <Row label="Request Info" value={request.request_info} />
              <Row label="Status" value={request.status} />
              <Row
                label="Created At"
                value={new Date(request.created_at).toLocaleString()}
              />

              {request.status === "pending" && (
                <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    sx={{ backgroundColor: "#215bb1" }}
                    onClick={() => handleReview(request.request_id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleReview(request.request_id, "rejected")}
                  >
                    Reject
                  </Button>
                </Box>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </Container>
  );
}

function Row({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 1 }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight="medium" sx={{ textAlign: "right" }}>
        {value ?? "-"}
      </Typography>
    </Box>
  );
}

export default CustomerServiceHomePage;