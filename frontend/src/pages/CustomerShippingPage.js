import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Container, Paper, TextField, Typography, Alert,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Checkbox, Divider, CircularProgress, Select, MenuItem, InputLabel,
} from "@mui/material";
import { getShippingServices, getQuote, startCheckout } from "../services/shippingService";
import { getCustomerProfile } from "../services/customerService";

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

function CustomerShippingPage() {
  const navigate = useNavigate();

  const [profile,         setProfile]         = useState(null);
  const [services,        setServices]        = useState({});
  const [pageLoading,     setPageLoading]     = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [pageError,       setPageError]       = useState("");

  const [formData, setFormData] = useState({
    selections:   {},
    destination:  { ...EMPTY_ADDRESS },
    receiverName: "",
    packages:     [{ weight: "", length: "", width: "", height: "", value: "" }],
  });

  const [errors,         setErrors]         = useState({});
  const [quote,          setQuote]          = useState(null);
  const [quoteLoading,   setQuoteLoading]   = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const setError    = (section, message) => setErrors(prev => ({ ...prev, [section]: message }));
  const clearErrors = () => setErrors({});

  useEffect(() => {
    Promise.all([getCustomerProfile(), getShippingServices()])
      .then(([profileData, servicesData]) => {
        setProfile(profileData);
        const grouped = groupByCategory(servicesData);
        setServices(grouped);
        setFormData((prev) => ({ ...prev, selections: buildInitialSelections(grouped) }));
      })
      .catch(() => setPageError("Failed to load page. Please refresh."))
      .finally(() => { setPageLoading(false); setServicesLoading(false); });
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSingleSelect = (category, value) => {
    setFormData((prev) => ({ ...prev, selections: { ...prev.selections, [category]: Number(value) } }));
    setQuote(null);
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
    setQuote(null);
  };

  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({ ...prev, destination: { ...prev.destination, [field]: value } }));
    setQuote(null);
  };

  const handlePackageChange = (index, field, value) => {
    setFormData((prev) => {
      const packages = [...prev.packages];
      packages[index] = { ...packages[index], [field]: value };
      return { ...prev, packages };
    });
    setQuote(null);
  };

  const addPackage = () => {
    setFormData((prev) => ({
      ...prev,
      packages: [...prev.packages, { weight: "", length: "", width: "", height: "", value: "" }],
    }));
    setQuote(null);
  };

  const removePackage = (index) => {
    setFormData((prev) => ({ ...prev, packages: prev.packages.filter((_, i) => i !== index) }));
    setQuote(null);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    clearErrors();
    let hasError = false;

    if (!formData.selections.region) { setError("services", "Please select a region."); hasError = true; }
    if (!formData.selections.time)   { setError("services", "Please select a delivery speed."); hasError = true; }

    if (!formData.receiverName.trim()) { setError("receiverName", "Please enter a receiver name."); hasError = true; }

    const { destination } = formData;
    if (!destination.streetAddr || !destination.city || !destination.state || !destination.country || !destination.postalCode) {
      setError("destination", "Please fill all destination address fields."); hasError = true;
    }

    if (formData.packages.some((pkg) => !pkg.weight || !pkg.length || !pkg.width || !pkg.height)) {
      setError("packages", "Please enter weight and dimensions for all packages."); hasError = true;
    }

    const insuranceId = services["add-on"]?.find((s) => s.service_name === "Insurance")?.service_type_no;
    if (insuranceId && formData.selections["add-on"].includes(insuranceId) && formData.packages.some((pkg) => !pkg.value)) {
      setError("packages", "Please enter a declared value for each package to include insurance."); hasError = true;
    }

    return !hasError;
  };

  const buildPayload = () => {
    const serviceTypes = Object.values(formData.selections)
      .flatMap((val) => (Array.isArray(val) ? val : val ? [val] : []));
    return {
      serviceTypes,
      destination:  formData.destination,
      receiverName: formData.receiverName,
      packages:     formData.packages,
    };
  };

  // ── Get Quote ─────────────────────────────────────────────────────────────
  const handleGetQuote = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setQuoteLoading(true);
      const data = await getQuote(buildPayload());
      setQuote(data.totalCost);
    } catch (err) {
      setError("api", err.response?.data?.message || "Failed to get quote.");
    } finally {
      setQuoteLoading(false);
    }
  };

  // ── Proceed to Payment ────────────────────────────────────────────────────
  const handleProceedToPayment = async () => {
    try {
      setPaymentLoading(true);
      const data = await startCheckout(buildPayload());
      navigate("/checkout", { state: { clientSecret: data.clientSecret } });
    } catch (err) {
      setError("api", err.response?.data?.message || "Failed to start checkout.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (pageLoading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;
  if (pageError)   return <Container sx={{ mt: 4 }}><Alert severity="error">{pageError}</Alert></Container>;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Ship a Package
        </Typography>

        <Box component="form" onSubmit={handleGetQuote}>

          {/* ── ORIGIN (read-only) ── */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Origin Address</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Your shipment will be picked up from your registered address.
            </Typography>
            <Typography>{profile.street_addr}{profile.addr_line_2 ? `, ${profile.addr_line_2}` : ""}</Typography>
            <Typography>{profile.city}, {profile.state} {profile.postal_code}</Typography>
            <Typography>{profile.country}</Typography>
          </Paper>

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

          {/* ── DESTINATION ── */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Destination Address</Typography>
            {errors.destination && <Alert severity="error" sx={{ mb: 2 }}>{errors.destination}</Alert>}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Receiver Name"
                value={formData.receiverName}
                onChange={(e) => { setFormData(prev => ({ ...prev, receiverName: e.target.value })); setQuote(null); }}
                error={!!errors.receiverName}
                helperText={errors.receiverName}
              />
              <TextField
                fullWidth
                label="Street Address"
                value={formData.destination.streetAddr}
                onChange={(e) => handleAddressChange("streetAddr", e.target.value)}
              />
              <TextField
                fullWidth
                label="Address Line 2 (Unit/Apt/Building)"
                value={formData.destination.unit}
                onChange={(e) => handleAddressChange("unit", e.target.value)}
              />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField fullWidth label="City" value={formData.destination.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)} />
                <TextField fullWidth label="State" value={formData.destination.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)} />
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    label="Country"
                    value={formData.destination.countrySelect ?? ""}
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
                <TextField fullWidth label="Postal Code" value={formData.destination.postalCode}
                  onChange={(e) => handleAddressChange("postalCode", e.target.value)} />
              </Box>
              {formData.destination.countrySelect === "OTHER" && (
                <TextField
                  fullWidth
                  label="Country Name (e.g. South Korea, Philippines)"
                  value={formData.destination.country}
                  onChange={(e) => handleAddressChange("country", e.target.value)}
                />
              )}
            </Box>
          </Paper>

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

          {/* ── QUOTE & PAYMENT ── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Button
              type="submit"
              variant="contained"
              sx={{ py: 1.5, backgroundColor: "#215bb1" }}
              disabled={quoteLoading || servicesLoading}
            >
              {quoteLoading ? "Getting Quote..." : "Get Quote"}
            </Button>

            {quote !== null && (
              <>
                <Alert severity="success" sx={{ whiteSpace: "nowrap" }}>
                  Estimated cost: ${quote.toFixed(2)}
                </Alert>
                <Button
                  variant="contained"
                  color="success"
                  sx={{ py: 1.5 }}
                  disabled={paymentLoading}
                  onClick={handleProceedToPayment}
                >
                  {paymentLoading ? "Loading..." : "Proceed to Payment"}
                </Button>
              </>
            )}
          </Box>

        </Box>
      </Box>
    </Container>
  );
}

export default CustomerShippingPage;
