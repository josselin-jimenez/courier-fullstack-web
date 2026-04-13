import { useState, useEffect } from "react";
import {
  Box, Button, Container, Paper, TextField, Typography, Alert,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Checkbox, Divider, CircularProgress, Select, MenuItem, InputLabel,
} from "@mui/material";
import { getShippingServices, calculateShippingEstimate } from "../services/shippingService";

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

// ── Stable references outside component ──────────────────────────────────────
const REQUIRED_CATEGORIES = ["region", "time"];

const CATEGORY_LABELS = {
  region:   "Region",
  time:     "Delivery Speed",
  handling: "Handling (optional)",
  caution:  "Caution (optional)",
  "add-on": "Add-ons (optional)",
};

const EMPTY_ADDRESS = { streetAddr: "", unit: "", city: "", state: "", country: "", postalCode: "", countrySelect: "" };

const groupByCategory = (rows) =>
  rows
    .filter((s) => s.service_category !== "created")
    .reduce((acc, s) => {
      const cat = s.service_category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    }, {});

const buildInitialSelections = (grouped) =>
  Object.keys(grouped).reduce((acc, cat) => {
    acc[cat] = cat === "add-on" ? [] : null;
    return acc;
  }, {});
// ─────────────────────────────────────────────────────────────────────────────

function ShippingCalculatorPage() {
  const [services, setServices]               = useState({});
  const [servicesLoading, setServicesLoading] = useState(true);

  const [formData, setFormData] = useState({
    selections:  {},
    origin:      { ...EMPTY_ADDRESS },
    destination: { ...EMPTY_ADDRESS },
    packages:    [{ weight: "", length: "", width: "", height: "", value: "" }],
  });

  const [errors,  setErrors]  = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const setError = (section, message) => setErrors(prev => ({ ...prev, [section]: message }));
  const clearErrors = () => setErrors({});

  // ── Fetch services on mount ───────────────────────────────────────────────
  useEffect(() => {
    getShippingServices()
      .then((data) => {
        const grouped = groupByCategory(data);
        setServices(grouped);
        setFormData((prev) => ({
          ...prev,
          selections: buildInitialSelections(grouped),
        }));
      })
      .catch(() => setError("services", "Failed to load services. Please refresh."))
      .finally(() => setServicesLoading(false));
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSingleSelect = (category, value) => {
    setFormData((prev) => ({
      ...prev,
      selections: { ...prev.selections, [category]: Number(value) },
    }));
  };

  const handleMultiSelect = (id, checked) => {
    setFormData((prev) => ({
      ...prev,
      selections: {
        ...prev.selections,
        "add-on": checked
          ? [...prev.selections["add-on"], Number(id)]
          : prev.selections["add-on"].filter((i) => i !== Number(id)),
      },
    }));
  };

  const handleAddressChange = (addressKey, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [addressKey]: { ...prev[addressKey], [field]: value },
    }));
  };

  const handlePackageChange = (index, field, value) => {
    setFormData((prev) => {
      const packages = [...prev.packages];
      packages[index] = { ...packages[index], [field]: value };
      return { ...prev, packages };
    });
  };

  const addPackage = () => {
    setFormData((prev) => ({
      ...prev,
      packages: [...prev.packages, { weight: "", length: "", width: "", height: "", value: "" }],
    }));
  };

  const removePackage = (index) => {
    setFormData((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index),
    }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    setSuccess("");

    let hasError = false;

    if (!formData.selections.region) { setError("services", "Please select a region."); hasError = true; }
    if (!formData.selections.time)   { setError("services", "Please select a delivery speed."); hasError = true; }

    if (!formData.origin.streetAddr || !formData.origin.city || !formData.origin.state || !formData.origin.country) {
      setError("origin", "Please fill all origin address fields."); hasError = true;
    }

    if (!formData.destination.streetAddr || !formData.destination.city || !formData.destination.state || !formData.destination.country) {
      setError("destination", "Please fill all destination address fields."); hasError = true;
    }

    if (formData.packages.some((pkg) => !pkg.weight || !pkg.length || !pkg.width || !pkg.height)) {
      setError("packages", "Please enter weight and dimensions for all packages."); hasError = true;
    }

    const insuranceId = services["add-on"]?.find((s) => s.service_name === "Insurance")?.service_type_no;
    if (insuranceId && formData.selections["add-on"].includes(insuranceId) && formData.packages.some((pkg) => !pkg.value)) {
      setError("packages", "Please enter a declared value for each package to include insurance."); hasError = true;
    }

    if (hasError) return;

    const serviceTypes = Object.values(formData.selections)
      .flatMap((val) => (Array.isArray(val) ? val : val ? [val] : []));

    try {
      setLoading(true);
      const data = await calculateShippingEstimate({
        serviceTypes,
        origin:      formData.origin,
        destination: formData.destination,
        packages:    formData.packages,
      });
      setSuccess(`Estimated cost: $${data.totalCost.toFixed(2)}`);
    } catch (err) {
      setError("api", err.response?.data?.message || "Failed to calculate estimate.");
    } finally {
      setLoading(false);
    }
  };

  // ── Address section — reused for origin and destination ───────────────────
  const renderAddressFields = (addressKey, label) => {
    const addr = formData[addressKey];

    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{label}</Typography>

        {errors[addressKey] && <Alert severity="error" sx={{ mb: 2 }}>{errors[addressKey]}</Alert>}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="Street Address"
            value={addr.streetAddr}
            onChange={(e) => handleAddressChange(addressKey, "streetAddr", e.target.value)}
          />
          <TextField
            fullWidth
            label="Address Line 2 (Unit/Apt/Building)"
            value={addr.unit}
            onChange={(e) => handleAddressChange(addressKey, "unit", e.target.value)}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField fullWidth label="City" value={addr.city}
              onChange={(e) => handleAddressChange(addressKey, "city", e.target.value)} />
            <TextField fullWidth label="State" value={addr.state}
              onChange={(e) => handleAddressChange(addressKey, "state", e.target.value)} />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                label="Country"
                value={addr.countrySelect ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  handleAddressChange(addressKey, "countrySelect", val);
                  handleAddressChange(addressKey, "country", val === "OTHER" ? "" : val);
                }}
              >
                {VALIDATION_COUNTRIES.map(({ code, name }) => (
                  <MenuItem key={code} value={code}>{code} — {name}</MenuItem>
                ))}
                <MenuItem value="OTHER">Other (not listed)</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Postal Code" value={addr.postalCode}
              onChange={(e) => handleAddressChange(addressKey, "postalCode", e.target.value)} />
          </Box>
          {addr.countrySelect === "OTHER" && (
            <TextField
              fullWidth
              label="Country Name (e.g. South Korea, Philippines)"
              value={addr.country}
              onChange={(e) => handleAddressChange(addressKey, "country", e.target.value)}
            />
          )}
        </Box>
      </Paper>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Shipping Calculator
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>

          {/* ── SERVICES ── */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Services</Typography>
            {errors.services && <Alert severity="error" sx={{ mb: 2 }}>{errors.services}</Alert>}

            {servicesLoading ? (
              <CircularProgress size={24} />
            ) : (
              Object.entries(services).map(([category, options], idx, arr) => (
                <Box key={category}>
                  <FormControl sx={{ mb: 1 }}>
                    <FormLabel>
                      {CATEGORY_LABELS[category] ?? category}
                      {REQUIRED_CATEGORIES.includes(category) && (
                        <Typography component="span" color="error"> *</Typography>
                      )}
                    </FormLabel>

                    {category === "add-on" ? (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
                        {options.map((s) => (
                          <FormControlLabel
                            key={s.service_type_no}
                            label={s.service_name}
                            control={
                              <Checkbox
                                checked={formData.selections["add-on"]?.includes(s.service_type_no) ?? false}
                                onChange={(e) => handleMultiSelect(s.service_type_no, e.target.checked)}
                              />
                            }
                          />
                        ))}
                      </Box>
                    ) : (
                      <RadioGroup
                        row
                        value={formData.selections[category] ?? ""}
                        onChange={(e) => handleSingleSelect(category, e.target.value)}
                      >
                        {options.map((s) => (
                          <FormControlLabel
                            key={s.service_type_no}
                            value={s.service_type_no}
                            label={s.service_name}
                            control={<Radio />}
                          />
                        ))}
                      </RadioGroup>
                    )}
                  </FormControl>

                  {idx < arr.length - 1 && <Divider sx={{ mb: 2 }} />}
                </Box>
              ))
            )}
          </Paper>

          {renderAddressFields("origin",      "Origin Address")}
          {renderAddressFields("destination", "Destination Address")}

          {/* ── PACKAGES ── */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Packages</Typography>
            {errors.packages && <Alert severity="error" sx={{ mb: 2 }}>{errors.packages}</Alert>}

            {formData.packages.map((pkg, i) => (
              <Box key={i}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="medium">Package {i + 1}</Typography>
                  {formData.packages.length > 1 && (
                    <Button size="small" color="error" onClick={() => removePackage(i)}>Remove</Button>
                  )}
                </Box>

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {["weight", "length", "width", "height"].map((field) => (
                    <TextField
                      key={field}
                      label={field.charAt(0).toUpperCase() + field.slice(1)}
                      type="number"
                      slotProps={{ htmlInput: { min: 0 } }}
                      value={pkg[field]}
                      onChange={(e) => handlePackageChange(i, field, e.target.value)}
                      sx={{ flex: "1 1 calc(25% - 12px)" }}
                    />
                  ))}
                  <TextField
                    label="Declared Value (for insurance)"
                    type="number"
                    slotProps={{ htmlInput: { min: 0 } }}
                    value={pkg.value}
                    onChange={(e) => handlePackageChange(i, "value", e.target.value)}
                    sx={{ flex: "1 1 100%" }}
                  />
                </Box>

                {i < formData.packages.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))}

            <Button variant="outlined" sx={{ mt: 2 }} onClick={addPackage}>
              + Add Package
            </Button>
          </Paper>

          {errors.api && <Alert severity="error" sx={{ mb: 2 }}>{errors.api}</Alert>}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ py: 1.5, backgroundColor: "#215bb1" }}
              disabled={loading || servicesLoading}
            >
              {loading ? "Calculating..." : "Get Estimate"}
            </Button>
            {success && (
              <Alert severity="success" sx={{ whiteSpace: "nowrap" }}>
                {success}
              </Alert>
            )}
          </Box>

        </Box>
      </Box>
    </Container>
  );
}

export default ShippingCalculatorPage;
