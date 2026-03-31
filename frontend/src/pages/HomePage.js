import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { Link } from "react-router-dom";

const features = [
  {
    icon: <LocalShippingIcon sx={{ fontSize: 48, color: "#215bb1" }} />,
    title: "Fast & Reliable Shipping",
    description:
      "Commercial and non-commercial shipping services that are fast, affordable, and tailored to your needs.",
    buttonLabel: "Ship with Us",
    buttonTo: "/login",
  },
  {
    icon: <SearchIcon sx={{ fontSize: 48, color: "#215bb1" }} />,
    title: "Easy Package Tracking",
    description:
      "No account needed. Enter your tracking number and get real-time updates on your shipment.",
    buttonLabel: "Track a Package",
    buttonTo: "/track",
  },
  {
    icon: <PersonAddIcon sx={{ fontSize: 48, color: "#215bb1" }} />,
    title: "Simple Account Setup",
    description:
      "Create an account in less than a minute to manage shipments and view history.",
    buttonLabel: "Create Account",
    buttonTo: "/register",
  },
];

function HomePage() {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          backgroundColor: "#215bb1",
          color: "white",
          py: 10,
          px: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Welcome to Our Courier Service
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, maxWidth: 600, mx: "auto" }}>
          Fast, affordable, and reliable shipping solutions for everyone — no matter the size of your package.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/register"
            sx={{ backgroundColor: "white", color: "#215bb1", fontWeight: "bold", "&:hover": { backgroundColor: "#e3eaf7" } }}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            to="/track"
            sx={{ borderColor: "white", color: "white", fontWeight: "bold", "&:hover": { borderColor: "#e3eaf7", color: "#e3eaf7" } }}
          >
            Track a Package
          </Button>
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, px: 4, backgroundColor: "#f5f7fa" }}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom color="#215bb1">
          What We Offer
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" mb={6}>
          Everything you need to send and receive packages with confidence.
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 4,
          }}
        >
          {features.map((feature) => (
            <Card elevation={3} key={feature.title} sx={{ textAlign: "center", borderRadius: 3, p: 2, display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box mb={2}>{feature.icon}</Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  component={Link}
                  to={feature.buttonTo}
                  sx={{ backgroundColor: "#215bb1", borderRadius: 2, fontWeight: "bold" }}
                  fullWidth
                >
                  {feature.buttonLabel}
                </Button>
              </Box>
            </Card>
          ))}
        </Box>
      </Box>      
      {/* CTA Section */}
      <Box sx={{ py: 8, px: 3, textAlign: "center" }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Ready to ship?
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Create a free account or log in to get started today.
        </Typography>
        <Button
          variant="contained"
          size="large"
          component={Link}
          to="/login"
          sx={{ backgroundColor: "#215bb1", fontWeight: "bold" }}
        >
          Login to Your Account
        </Button>
      </Box>
    </Box>
  );
}

export default HomePage;
