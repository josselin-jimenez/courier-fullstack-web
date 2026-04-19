import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useAuth } from "../context/authContext";
import { jwtDecode } from "jwt-decode";
import { registerUser, loginUser } from "../services/authService";

const VALIDATION_COUNTRIES = [
  { code: "AR", name: "Argentina" },
  { code: "AT", name: "Austria" },
  { code: "AU", name: "Australia" },
  { code: "BE", name: "Belgium" },
  { code: "BG", name: "Bulgaria" },
  { code: "BR", name: "Brazil" },
  { code: "CA", name: "Canada" },
  { code: "CH", name: "Switzerland" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "CZ", name: "Czechia" },
  { code: "DE", name: "Germany" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "ES", name: "Spain" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" },
  { code: "HR", name: "Croatia" },
  { code: "HU", name: "Hungary" },
  { code: "IE", name: "Ireland" },
  { code: "IN", name: "India" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "LV", name: "Latvia" },
  { code: "MX", name: "Mexico" },
  { code: "MY", name: "Malaysia" },
  { code: "NL", name: "Netherlands" },
  { code: "NO", name: "Norway" },
  { code: "NZ", name: "New Zealand" },
  { code: "PL", name: "Poland" },
  { code: "PR", name: "Puerto Rico" },
  { code: "PT", name: "Portugal" },
  { code: "SE", name: "Sweden" },
  { code: "SG", name: "Singapore" },
  { code: "SI", name: "Slovenia" },
  { code: "SK", name: "Slovakia" },
  { code: "US", name: "United States" },
];

const EMPTY_ADDRESS = { streetAddr: "", unit: "", city: "", state: "", country: "", postalCode: "", countrySelect: "" };

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    custAddress: { ...EMPTY_ADDRESS }
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

  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      custAddress: { ...prev.custAddress, [field]: value },
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

    const addr = formData.custAddress;
    if (!addr.streetAddr || !addr.city || !addr.state || !addr.country) {
      setError("Please fill in all address fields.");
      return;
    }

    // Prepend +1 if user didn't include a country code
    let phone = formData.phone.trim();
    if (/^[0-9]/.test(phone)) phone = "+1" + phone;

    try {
      setLoading(true);

      await registerUser(formData.name, formData.email, formData.password, phone, formData.custAddress);

      // Auto-login with the same credentials
      const token = await loginUser(formData.email, formData.password);
      login(token);
      setSuccess("Account created successfully.");

      const decoded = jwtDecode(token);

      setTimeout(() => {
        if (decoded.role === "admin") {
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

  const addr = formData.custAddress;

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
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

            {/* ── ADDRESS ── */}
            <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
              Customer Address
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Street Address"
                value={addr.streetAddr}
                onChange={(e) => handleAddressChange("streetAddr", e.target.value)}
              />
              <TextField
                fullWidth
                label=" *Optional: Address Line 2 (Unit/Apt/Building)"
                value={addr.unit}
                onChange={(e) => handleAddressChange("unit", e.target.value)}
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="City"
                  value={addr.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                />
                <TextField
                  fullWidth
                  label="State"
                  value={addr.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    label="Country"
                    value={addr.countrySelect}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleAddressChange("countrySelect", val);
                      handleAddressChange("country", val === "OTHER" ? "" : val);
                    }}
                  >
                    {VALIDATION_COUNTRIES.map(({ code, name }) => (
                      <MenuItem key={code} value={code}>{code} — {name}</MenuItem>
                    ))}
                    <MenuItem value="OTHER">Other (not listed)</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={addr.postalCode}
                  onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                />
              </Box>

              {addr.countrySelect === "OTHER" && (
                <TextField
                  fullWidth
                  label="Country Name (e.g. South Korea, Philippines)"
                  value={addr.country}
                  onChange={(e) => handleAddressChange("country", e.target.value)}
                />
              )}
            </Box>

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