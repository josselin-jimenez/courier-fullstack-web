import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useAuth } from "../context/authContext";
import { jwtDecode } from "jwt-decode";
import { registerUser, loginUser } from "../services/authService";

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setError("Please fill in all fields.");
      return;
    }

    // Prepend +1 if user didn't include a country code
    let phone = formData.phone.trim();
    if (/^[0-9]/.test(phone)) phone = "+1" + phone;

    try {
      setLoading(true);

      await registerUser(formData.name, formData.email, formData.password, phone);

      // Auto-login with the same credentials
      const token = await loginUser(formData.email, formData.password);
      login(token);
      setSuccess("Account created successfully.");

      const decoded = jwtDecode(token);

      setTimeout(() => {
        if (decoded.role === "uma") {
          navigate("/UmaHome");
        } else if (decoded.role === "admin") {
          navigate("/AdminHome");
        } else if (decoded.role === "driver") {
          navigate("/DriverHome");
        } else if (decoded.role === "handler") {
          navigate("/HandlerHome");
        } else if (decoded.role === "customer service") {
          navigate("/CustomerServiceHome");
        } else if (decoded.role === "customer") {
          navigate("/CustomerHome");
        } else {
          navigate("/");
        }
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper elevation={4} sx={{ p: 4, width: "100%", borderRadius: 3 }}>
          <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
            Register
          </Typography>

          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Create your courier account.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              margin="normal"
              value={formData.name}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              margin="normal"
              value={formData.email}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              margin="normal"
              value={formData.password}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              margin="normal"
              placeholder="+12025550123"
              value={formData.phone}
              onChange={handleChange}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, py: 1.2, backgroundColor: "#215bb1" }}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default RegisterPage;
