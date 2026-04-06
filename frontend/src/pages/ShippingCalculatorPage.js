import { useState, useEffect } from "react";
import {
  Box, Button, Container, Paper, TextField, Typography, Alert,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Checkbox, Divider, CircularProgress,
} from "@mui/material";
import api from "../api/axios";

// ── Stable references outside component ──────────────────────────────────────
const REQUIRED_CATEGORIES = ["region", "time"];

const CATEGORY_LABELS = {
  region:   "Region",
  time:     "Delivery Speed",
  handling: "Handling (optional)",
  caution:  "Caution (optional)",
  "add-on": "Add-ons (optional)",
};

const EMPTY_ADDRESS = { street_addr: "", city: "", state: "", country: "", postalCode: "" };

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
    selections:          {},
    origin:              { ...EMPTY_ADDRESS },
    originIsMilitary:    false,
    destination:         { ...EMPTY_ADDRESS },
    destinationIsMilitary: false,
    packages:            [{ weight: "", length: "", width: "", height: "", value: "" }],
  });

  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Fetch services on mount ───────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/shipping/services")
      .then((res) => {
        const grouped = groupByCategory(res.data);
        setServices(grouped);
        setFormData((prev) => ({
          ...prev,
          selections: buildInitialSelections(grouped),
        }));
      })
      .catch(() => setError("Failed to load services. Please refresh."))
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

  const handleMilitaryToggle = (flagKey) => {
    setFormData((prev) => ({
      ...prev,
      [flagKey]: !prev[flagKey],
      // Clear the address when toggling so the user re-enters in the right format
      [flagKey === "originIsMilitary" ? "origin" : "destination"]: { ...EMPTY_ADDRESS },
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
    setError("");
    setSuccess("");

    if (!formData.selections.region) { setError("Please select a region."); return; }
    if (!formData.selections.time)   { setError("Please select a delivery speed."); return; }
    if (!formData.origin.street_addr || !formData.origin.city || !formData.origin.state || !formData.origin.country) {
      setError("Please fill all origin address fields."); return;
    }
    if (!formData.destination.street_addr || !formData.destination.city || !formData.destination.state || !formData.destination.country) {
      setError("Please fill all destination address fields."); return;
    }
    if (formData.packages.some((pkg) => !pkg.weight || !pkg.length || !pkg.width || !pkg.height)) {
      setError("Please enter weight and dimensions for all packages."); return;
    }

    const insuranceId = services["add-on"]?.find((s) => s.service_name === "Insurance")?.service_type_no;
    if (insuranceId && formData.selections["add-on"].includes(insuranceId) && formData.packages.some((pkg) => !pkg.value)) {
      setError("Please enter a declared value for each package to include insurance."); return;
    }

    const serviceTypes = Object.values(formData.selections)
      .flatMap((val) => (Array.isArray(val) ? val : val ? [val] : []));

    try {
      setLoading(true);
      const res = await api.post("/api/shipping/estimate", {
        serviceTypes,
        origin:                formData.origin,
        originIsMilitary:      formData.originIsMilitary,
        destination:           formData.destination,
        destinationIsMilitary: formData.destinationIsMilitary,
        packages:              formData.packages,
      });
      setSuccess(`Estimated cost: $${res.data.totalCost.toFixed(2)}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to calculate estimate.");
    } finally {
      setLoading(false);
    }
  };

  // ── Address section — reused for origin and destination ───────────────────
  const renderAddressFields = (addressKey, flagKey, label) => {
    const addr       = formData[addressKey];
    const isMilitary = formData[flagKey];

    return (
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">{label}</Typography>
          <FormControlLabel
            label="Military address (APO/FPO/DPO)"
            control={
              <Checkbox
                checked={isMilitary}
                onChange={() => handleMilitaryToggle(flagKey)}
              />
            }
          />
        </Box>

        {isMilitary && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Enter the military address manually — e.g. street: "Unit 1234 Box 5678", city: "APO", state: "AE", country: "United States", postal: "09001".
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth label="Street Address"
            value={addr.street_addr}
            onChange={(e) => handleAddressChange(addressKey, "street_addr", e.target.value)}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField fullWidth label="City"  value={addr.city}
              onChange={(e) => handleAddressChange(addressKey, "city",  e.target.value)} />
            <TextField fullWidth label="State" value={addr.state}
              onChange={(e) => handleAddressChange(addressKey, "state", e.target.value)} />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField fullWidth label="Country"     value={addr.country}
              onChange={(e) => handleAddressChange(addressKey, "country",    e.target.value)} />
            <TextField fullWidth label="Postal Code" value={addr.postalCode}
              onChange={(e) => handleAddressChange(addressKey, "postalCode", e.target.value)} />
          </Box>
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

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>

          {/* ── SERVICES ── */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Services</Typography>

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

          {renderAddressFields("origin",      "originIsMilitary",      "Origin Address")}
          {renderAddressFields("destination", "destinationIsMilitary", "Destination Address")}

          {/* ── PACKAGES ── */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Packages</Typography>

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
