import { useLocation, useNavigate } from "react-router-dom";
import { Box, Button, Container, Paper, Typography, Divider } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

function OrderConfirmationPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const { totalCost, trackingNumber } = state ?? {};

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 72, color: "success.main", mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Order Confirmed!
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Your shipment has been placed successfully.
        </Typography>

        {totalCost != null && (
          <Paper elevation={2} sx={{ p: 3, mb: 4, width: "100%" }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Receipt</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>Amount charged</Typography>
              <Typography fontWeight="bold">${totalCost.toFixed(2)}</Typography>
            </Box>
            {trackingNumber && (
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography>Tracking number</Typography>
                <Typography fontWeight="bold" fontFamily="monospace">{trackingNumber}</Typography>
              </Box>
            )}
          </Paper>
        )}

        <Button
          variant="contained"
          sx={{ backgroundColor: "#215bb1" }}
          onClick={() => navigate("/CustomerHome")}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  );
}

export default OrderConfirmationPage;
