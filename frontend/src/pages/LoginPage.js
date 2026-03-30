// React hook for managing local state (form values, errors, loading)
import { useState } from "react";
// from React Router; lets you programmatically redirect to another page
import { useNavigate } from "react-router-dom";
// MUI components 
import {
  Box,          //div wrapper
  Button,       //text
  Container,    //max-width centering
  Paper,        //card with shadow
  TextField,    //input
  Typography,   //text
  Alert,        //error/success banners
} from "@mui/material";
// configured Axios instance for making HTTP requests to the backend
import api from "../api/axios";
// your custom auth context hook, which exposes the login function
import { useAuth } from "../context/authContext";

import { jwtDecode } from "jwt-decode";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // holds what the user has typed in the email/password fields
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // messages shown to the user
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // whether a request is in flight (disables the button, changes its text)
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // called when form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault();     // stops the browser from doing a full-page reload
    setError("");     // clears any previous error/success messages
    setSuccess("");   // ^

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    try { 
      setLoading(true);

      //API call — POST's { email, password } to /api/auth/login
      const response = await api.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      login(response.data.token);
      setSuccess("Login successful.");

      const decoded = jwtDecode(response.data.token);

      setTimeout(() => {
        if (decoded.role === "uma") {
          navigate("/UmaHome");
        } else if (decoded.role === "admin") {
          navigate("/AdminHome");
        } else if (decoded.role === "driver") {
          navigate("/DriverHome");
        } else if (decoded.role === "handler") {
          navigate("/HandlerHome")
        } else if (decoded.role === "customer service") {
          navigate("/CustomerServiceHome")
        } else if (decoded.role === "customer") {
          navigate("/CustomerHome")
        } else {
          navigate("/");
        }
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally { // always sets loading back to false
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
            Login
          </Typography>

          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Sign in to access your courier account.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, py: 1.2, backgroundColor: "#215bb1" }}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default LoginPage;