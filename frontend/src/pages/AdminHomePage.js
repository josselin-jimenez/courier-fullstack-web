// pages/AdminHomePage.js
import { useEffect, useState } from "react";
import {
  Box, Container, Paper, Typography, CircularProgress, Alert, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, InputAdornment, Button, MenuItem, Select,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, IconButton, Tooltip,
} from "@mui/material";
import PeopleIcon         from "@mui/icons-material/People";
import LocalShippingIcon  from "@mui/icons-material/LocalShipping";
import AttachMoneyIcon    from "@mui/icons-material/AttachMoney";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import SearchIcon         from "@mui/icons-material/Search";
import PersonAddIcon      from "@mui/icons-material/PersonAdd";
import AssessmentIcon     from "@mui/icons-material/Assessment";
import DeleteIcon         from "@mui/icons-material/Delete";
import EditIcon           from "@mui/icons-material/Edit";
import BadgeIcon          from "@mui/icons-material/Badge";
import { useAuth }        from "../context/authContext";
import {
  getAdminDashboard, getRevenueReport,
  addEmployee, editEmployee, deleteEmployee,
} from "../services/employeeService";
import { editCustomerType } from "../services/scanService";

const GREEN = "#2e7d32";

const roleColors = {
  customer: "primary", admin: "error",
  driver: "success", handler: "success", "customer service": "warning",
};

function StatCard({ icon, label, value, sub }) {
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3, flex: "1 1 160px" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ color: GREEN }}>{icon}</Box>
        <Box>
          <Typography variant="h5" fontWeight="bold">{value}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
        </Box>
      </Box>
    </Paper>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ── Revenue Report ─────────────────────────────────────────────────────────────
function RevenueReport() {
  const today        = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate,   setEndDate]   = useState(today);
  const [report,    setReport]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const handleGenerate = async () => {
    if (!startDate || !endDate) { setError("Please select both dates."); return; }
    if (startDate > endDate)    { setError("Start date must be before end date."); return; }
    setError(""); setLoading(true);
    try { setReport(await getRevenueReport(startDate, endDate)); }
    catch (err) { setError(err.response?.data?.message || "Failed to generate report."); }
    finally { setLoading(false); }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <AssessmentIcon sx={{ color: GREEN }} />
        <Typography variant="h6" fontWeight="bold">Revenue Report</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
        <TextField label="Start Date" type="date" value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setReport(null); }}
          size="small" InputLabelProps={{ shrink: true }} />
        <TextField label="End Date" type="date" value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setReport(null); }}
          size="small" InputLabelProps={{ shrink: true }} />
        <Button variant="contained" onClick={handleGenerate} disabled={loading}
          sx={{ backgroundColor: GREEN }}>
          {loading ? "Generating..." : "Generate Report"}
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {report && (
        <>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
            {[
              ["Total Revenue",    `$${Number(report.totals.total_revenue).toFixed(2)}`],
              ["Shipments",         report.totals.shipment_count],
              ["Avg per Shipment", `$${Number(report.totals.avg_payment).toFixed(2)}`],
              ["Min – Max",        `$${Number(report.totals.min_payment).toFixed(2)} – $${Number(report.totals.max_payment).toFixed(2)}`],
            ].map(([label, val]) => (
              <Paper key={label} variant="outlined" sx={{ p: 2, flex: "1 1 130px", textAlign: "center" }}>
                <Typography variant="h6" fontWeight="bold" color={GREEN}>{val}</Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
              </Paper>
            ))}
          </Box>
          {report.by_method.length > 0 && (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
              {report.by_method.map((m) => (
                <Paper key={m.payment_method} variant="outlined" sx={{ p: 2, flex: "1 1 110px", textAlign: "center" }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ textTransform: "capitalize" }}>{m.payment_method}</Typography>
                  <Typography variant="h6" color={GREEN}>${Number(m.revenue).toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.count} payments</Typography>
                </Paper>
              ))}
            </Box>
          )}
          {report.daily_breakdown.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f1f8f1" }}>
                    <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: GREEN }} align="center">Shipments</TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: GREEN }} align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.daily_breakdown.map((d) => (
                    <TableRow key={d.date_paid} hover>
                      <TableCell>{formatDate(d.date_paid)}</TableCell>
                      <TableCell align="center">{d.shipment_count}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: GREEN }}>
                        ${Number(d.daily_revenue).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">No shipments in this date range.</Typography>
          )}
        </>
      )}
    </Paper>
  );
}

// ── Add Employee ───────────────────────────────────────────────────────────────
function AddEmployeeForm({ facilities, onAdded }) {
  const EMPTY = { name: "", email: "", phone: "", password: "", role: "", facilityId: "" };
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const handleChange = (f, v) => { setForm((p) => ({ ...p, [f]: v })); setError(""); setSuccess(""); };
  const handleSubmit = async () => {
    setError(""); setSuccess("");
    const { name, email, phone, password, role, facilityId } = form;
    if (!name || !email || !phone || !password || !role || !facilityId) { setError("All fields are required."); return; }
    try {
      setLoading(true);
      await addEmployee({ name, email, phone, password, role, facilityId: Number(facilityId) });
      setSuccess(`${role.charAt(0).toUpperCase() + role.slice(1)} account created!`);
      setForm(EMPTY);
      if (onAdded) onAdded();
    } catch (err) { setError(err.response?.data?.message || "Failed to create employee."); }
    finally { setLoading(false); }
  };
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <PersonAddIcon sx={{ color: GREEN }} />
        <Typography variant="h6" fontWeight="bold">Add Employee</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField label="Full Name"  value={form.name}     onChange={(e) => handleChange("name",  e.target.value)} size="small" sx={{ flex: "1 1 200px" }} />
          <TextField label="Email"      value={form.email}    onChange={(e) => handleChange("email", e.target.value)} size="small" sx={{ flex: "1 1 200px" }} />
        </Box>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField label="Phone (e.g. +12025550123)" value={form.phone}    onChange={(e) => handleChange("phone",    e.target.value)} size="small" sx={{ flex: "1 1 200px" }} />
          <TextField label="Password (min 8 chars)"    value={form.password} onChange={(e) => handleChange("password", e.target.value)} type="password" size="small" sx={{ flex: "1 1 200px" }} />
        </Box>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ flex: "1 1 180px" }}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={form.role} onChange={(e) => handleChange("role", e.target.value)}>
              <MenuItem value="driver">Driver</MenuItem>
              <MenuItem value="handler">Handler</MenuItem>
              <MenuItem value="customer service">Customer Service</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: "1 1 220px" }}>
            <InputLabel>Facility</InputLabel>
            <Select label="Facility" value={form.facilityId} onChange={(e) => handleChange("facilityId", e.target.value)}>
              {facilities.map((f) => (
                <MenuItem key={f.facility_id} value={f.facility_id}>
                  {f.facility_name} ({f.department_type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ backgroundColor: GREEN }}>
            {loading ? "Creating..." : "Create Employee Account"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

// ── Edit Employee Dialog ───────────────────────────────────────────────────────
function EditEmployeeDialog({ open, employee, facilities, onClose, onSaved }) {
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  useEffect(() => {
    if (employee) { setForm({ name: employee.name || "", email: employee.email || "", phone: employee.phone_num || "", role: employee.role || "", facilityId: employee.facility_id || "", password: "" }); setError(""); }
  }, [employee]);
  const handleChange = (f, v) => { setForm((p) => ({ ...p, [f]: v })); setError(""); };
  const handleSave = async () => {
    setError("");
    const payload = {};
    if (form.name       !== employee.name)        payload.name       = form.name;
    if (form.email      !== employee.email)       payload.email      = form.email;
    if (form.phone      !== employee.phone_num)   payload.phone      = form.phone;
    if (form.role       !== employee.role)        payload.role       = form.role;
    if (form.facilityId !== employee.facility_id) payload.facilityId = Number(form.facilityId);
    if (form.password)                            payload.password   = form.password;
    if (Object.keys(payload).length === 0) { setError("No changes detected."); return; }
    try {
      setLoading(true);
      await editEmployee(employee.user_id, payload);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.message || "Failed to update employee."); }
    finally { setLoading(false); }
  };
  if (!employee) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Employee — {employee.name}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Full Name"  value={form.name  || ""} onChange={(e) => handleChange("name",  e.target.value)} size="small" fullWidth />
          <TextField label="Email"      value={form.email || ""} onChange={(e) => handleChange("email", e.target.value)} size="small" fullWidth />
          <TextField label="Phone"      value={form.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} size="small" fullWidth />
          <TextField label="New Password (leave blank to keep)" value={form.password || ""} onChange={(e) => handleChange("password", e.target.value)} type="password" size="small" fullWidth />
          <FormControl size="small" fullWidth>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={form.role || ""} onChange={(e) => handleChange("role", e.target.value)}>
              <MenuItem value="driver">Driver</MenuItem>
              <MenuItem value="handler">Handler</MenuItem>
              <MenuItem value="customer service">Customer Service</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Facility</InputLabel>
            <Select label="Facility" value={form.facilityId || ""} onChange={(e) => handleChange("facilityId", e.target.value)}>
              {facilities.map((f) => (
                <MenuItem key={f.facility_id} value={f.facility_id}>{f.facility_name} ({f.department_type})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ backgroundColor: GREEN }}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ──────────────────────────────────────────────────────
function DeleteConfirmDialog({ open, employee, onClose, onConfirmed }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const handleDelete = async () => {
    setError("");
    try {
      setLoading(true);
      await deleteEmployee(employee.user_id);
      onConfirmed(); onClose();
    } catch (err) { setError(err.response?.data?.message || "Failed to delete employee."); }
    finally { setLoading(false); }
  };
  if (!employee) return null;
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Employee</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <DialogContentText>
          Are you sure you want to delete <strong>{employee.name}</strong> ({employee.email})? This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" color="error" onClick={handleDelete} disabled={loading}>
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Edit Customer Type Dialog ──────────────────────────────────────────────────
function EditCustomerTypeDialog({ open, customer, onClose, onSaved }) {
  const [custType,     setCustType]     = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  useEffect(() => {
    if (customer) {
      setCustType(customer.cust_type || "Normal");
      setBusinessName(customer.business_name || "");
      setError("");
    }
  }, [customer]);

  const handleSave = async () => {
    setError("");
    if (custType === "Business" && !businessName.trim()) {
      setError("Business name is required for Business accounts."); return;
    }
    try {
      setLoading(true);
      await editCustomerType(customer.user_id, custType, businessName);
      onSaved(); onClose();
    } catch (err) { setError(err.response?.data?.message || "Failed to update customer type."); }
    finally { setLoading(false); }
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Account Type — {customer.name}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Account Type</InputLabel>
            <Select label="Account Type" value={custType} onChange={(e) => { setCustType(e.target.value); setError(""); }}>
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Business">Business</MenuItem>
            </Select>
          </FormControl>
          {custType === "Business" && (
            <TextField
              label="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              size="small"
              fullWidth
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading} sx={{ backgroundColor: GREEN }}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────────────
function AdminHomePage() {
  const { user }                      = useAuth();
  const [data,       setData]         = useState(null);
  const [loading,    setLoading]      = useState(true);
  const [error,      setError]        = useState("");
  const [custSearch, setCustSearch]   = useState("");
  const [empSearch,  setEmpSearch]    = useState("");
  const [editTarget,    setEditTarget]    = useState(null);
  const [editOpen,      setEditOpen]      = useState(false);
  const [delTarget,     setDelTarget]     = useState(null);
  const [delOpen,       setDelOpen]       = useState(false);
  const [custEditTarget, setCustEditTarget] = useState(null);
  const [custEditOpen,   setCustEditOpen]   = useState(false);

  const loadDashboard = () => {
    setLoading(true);
    getAdminDashboard()
      .then(setData)
      .catch(() => setError("Failed to load admin dashboard."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDashboard(); }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;
  if (error)   return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const { stats, recent_shipments, employees, customers, pending_requests, facilities } = data;

  const filteredEmployees = employees.filter((u) =>
    u.name.toLowerCase().includes(empSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(empSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(empSearch.toLowerCase())
  );
  const filteredCustomers = customers.filter((u) =>
    u.name.toLowerCase().includes(custSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(custSearch.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Admin Dashboard</Typography>

      {/* Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <StatCard icon={<LocalShippingIcon sx={{ fontSize: 32 }} />} label="Total shipments"   value={stats.total_shipments} />
        <StatCard icon={<AttachMoneyIcon   sx={{ fontSize: 32 }} />} label="Total revenue"
          value={`$${Number(stats.total_revenue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <StatCard icon={<PeopleIcon        sx={{ fontSize: 32 }} />} label="Total users"       value={stats.total_users} sub={`${stats.total_customers} customers`} />
        <StatCard icon={<PendingActionsIcon sx={{ fontSize: 32 }} />} label="Pending requests" value={stats.pending_requests} />
      </Box>

      <RevenueReport />
      <AddEmployeeForm facilities={facilities} onAdded={loadDashboard} />

      {/* Pending business requests */}
      {pending_requests.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <PendingActionsIcon sx={{ color: GREEN }} />
            <Typography variant="h6" fontWeight="bold">Pending Business Requests</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f1f8f1" }}>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Business Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Submitted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pending_requests.map((r) => (
                  <TableRow key={r.request_id} hover>
                    <TableCell>{r.name}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{r.email}</TableCell>
                    <TableCell>{r.business_name}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>{formatDate(r.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Recent shipments */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <LocalShippingIcon sx={{ color: GREEN }} />
          <Typography variant="h6" fontWeight="bold">Recent Shipments</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {recent_shipments.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>No shipments yet.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f1f8f1" }}>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Tracking #</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Receiver</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Destination</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }} align="right">Total</TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: GREEN }} align="right">Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recent_shipments.map((s) => (
                  <TableRow key={s.shipment_id} hover>
                    <TableCell><Typography variant="body2" fontFamily="monospace" fontWeight="bold" color={GREEN}>{s.tracking_number}</Typography></TableCell>
                    <TableCell>{s.customer_name}</TableCell>
                    <TableCell>{s.receiver_name}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{s.dest_city}, {s.dest_country}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>${Number(s.total_paid).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: "text.secondary", fontSize: 13 }}>{formatDate(s.date_paid)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Employees table */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BadgeIcon sx={{ color: GREEN }} />
            <Typography variant="h6" fontWeight="bold">Employees</Typography>
            <Typography variant="caption" color="text.secondary">(admin, driver, handler, customer service)</Typography>
          </Box>
          <TextField size="small" placeholder="Search employees" value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)} sx={{ width: 240 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        </Box>
        <Divider sx={{ mb: 2 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f1f8f1" }}>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Name</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Email</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Role</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Facility</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.map((u) => (
                <TableRow key={u.user_id} hover>
                  <TableCell>{u.name}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{u.email}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{u.phone_num}</TableCell>
                  <TableCell>
                    <Chip label={u.role} color={roleColors[u.role] ?? "default"} size="small" sx={{ textTransform: "capitalize" }} />
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>{u.facility_name || "—"}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => { setEditTarget(u); setEditOpen(true); }}>
                        <EditIcon fontSize="small" sx={{ color: GREEN }} />
                      </IconButton>
                    </Tooltip>
                    {u.user_id !== user?.id && (
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => { setDelTarget(u); setDelOpen(true); }}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 3 }}>No employees match your search.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Customers table */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PeopleIcon sx={{ color: GREEN }} />
            <Typography variant="h6" fontWeight="bold">Customers</Typography>
          </Box>
          <TextField size="small" placeholder="Search customers" value={custSearch}
            onChange={(e) => setCustSearch(e.target.value)} sx={{ width: 240 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        </Box>
        <Divider sx={{ mb: 2 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f1f8f1" }}>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Name</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Email</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Account Type</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }}>Business</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: GREEN }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((u) => (
                <TableRow key={u.user_id} hover>
                  <TableCell>{u.name}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{u.email}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{u.phone_num}</TableCell>
                  <TableCell>
                    <Chip label={u.cust_type} color={u.cust_type === "Business" ? "warning" : "primary"} size="small" />
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{u.business_name || "—"}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Account Type">
                      <IconButton size="small" onClick={() => { setCustEditTarget(u); setCustEditOpen(true); }}>
                        <EditIcon fontSize="small" sx={{ color: GREEN }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 3 }}>No customers match your search.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialogs */}
      <EditEmployeeDialog open={editOpen} employee={editTarget} facilities={facilities}
        onClose={() => setEditOpen(false)} onSaved={loadDashboard} />
      <DeleteConfirmDialog open={delOpen} employee={delTarget}
        onClose={() => setDelOpen(false)} onConfirmed={loadDashboard} />
      <EditCustomerTypeDialog open={custEditOpen} customer={custEditTarget}
        onClose={() => setCustEditOpen(false)} onSaved={loadDashboard} />
    </Container>
  );
}

export default AdminHomePage;