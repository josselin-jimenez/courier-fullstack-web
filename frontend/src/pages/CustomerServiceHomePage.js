import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  getAllCustomerTypeRequests,
  reviewCustomerTypeRequest,
} from "../services/customerService";

const statusColor = { pending: "warning", approved: "success", rejected: "error" };

function CustomerServiceHomePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [hidePending, setHidePending] = useState(false);

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

      <FormControlLabel
        control={
          <Checkbox
            checked={hidePending}
            onChange={(e) => setHidePending(e.target.checked)}
          />
        }
        label="Hide handled requests"
        sx={{ mb: 2 }}
      />

      {requests.length === 0 ? (
        <Typography>No customer type requests found.</Typography>
      ) : (
        requests
          .filter((r) => !hidePending || r.status === "pending")
          .map((request) => (
          <Accordion
            key={request.request_id}
            expanded={expanded === request.request_id}
            onChange={(_, isExpanded) =>
              setExpanded(isExpanded ? request.request_id : false)
            }
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", width: "100%" }}>
                <Typography fontWeight="bold" sx={{ minWidth: 100 }}>
                  #{request.request_id}
                </Typography>
                <Typography sx={{ flexGrow: 1 }}>{request.name}</Typography>
                <Typography color="text.secondary" sx={{ mr: 2 }}>
                  {request.cust_type} → {request.requested_type}
                </Typography>
                <Chip
                  label={request.status}
                  color={statusColor[request.status] ?? "default"}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(request.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              <Divider sx={{ mb: 2 }} />
              <Row label="Email" value={request.email} />
              <Row label="Phone" value={request.phone_num} />
              <Row label="Business Name" value={request.business_name} />
              <Row label="Request Info" value={request.request_info} />
              <Row label="Submitted" value={new Date(request.created_at).toLocaleString()} />

              {request.status === "pending" && (
                <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
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
            </AccordionDetails>
          </Accordion>
        ))
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
