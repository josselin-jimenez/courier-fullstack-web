import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Button, Container, Paper, TextField, Typography, Alert,
  Divider, CircularProgress,
} from "@mui/material";
import { createShipment } from "../services/shippingService";

function CheckoutPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const { payload, totalCost } = state ?? {};

  const [card,    setCard]    = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setCard(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!card.name.trim())   return "Please enter the name on your card.";
    if (!card.number.trim()) return "Please enter a card number.";
    if (!card.expiry.trim()) return "Please enter an expiry date.";
    if (!card.cvv.trim())    return "Please enter a CVV.";
    return null;
  };

  const handlePay = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    try {
      setError("");
      setLoading(true);
      const data = await createShipment(payload);
      navigate("/order-confirmation", { state: { totalCost: data.totalCost, trackingNumber: data.trackingNumber } });
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!payload || totalCost == null) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">No order data found. Please go back and get a quote first.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Payment
        </Typography>

        {/* ── Order Summary ── */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Order Summary</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography>Shipping total</Typography>
            <Typography fontWeight="bold">${totalCost.toFixed(2)}</Typography>
          </Box>
        </Paper>

        {/* ── Card Details ── */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Card Details</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Name on Card"
              value={card.name}
              onChange={e => handleChange("name", e.target.value)}
            />
            <TextField
              fullWidth
              label="Card Number"
              slotProps={{ htmlInput: { maxLength: 19 } }}
              value={card.number}
              onChange={e => handleChange("number", e.target.value)}
              placeholder="1234 5678 9012 3456"
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Expiry (MM/YY)"
                slotProps={{ htmlInput: { maxLength: 5 } }}
                value={card.expiry}
                onChange={e => handleChange("expiry", e.target.value)}
                placeholder="MM/YY"
              />
              <TextField
                fullWidth
                label="CVV"
                slotProps={{ htmlInput: { maxLength: 4 } }}
                value={card.cvv}
                onChange={e => handleChange("cvv", e.target.value)}
                placeholder="123"
              />
            </Box>
          </Box>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Button
          fullWidth
          variant="contained"
          color="success"
          size="large"
          disabled={loading}
          onClick={handlePay}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : `Pay $${totalCost.toFixed(2)}`}
        </Button>
      </Box>
    </Container>
  );
}

export default CheckoutPage;
