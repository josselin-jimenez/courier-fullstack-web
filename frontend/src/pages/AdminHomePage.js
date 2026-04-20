// AdminHomePage
import { useEffect, useState } from "react";
import {
  Box, Container, Paper, Typography, CircularProgress, Alert,
  Divider, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, TextField, InputAdornment,
} from "@mui/material";
import PeopleIcon         from "@mui/icons-material/People";
import LocalShippingIcon  from "@mui/icons-material/LocalShipping";
import AttachMoneyIcon    from "@mui/icons-material/AttachMoney";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import SearchIcon         from "@mui/icons-material/Search";
import { getAdminDashboard } from "../services/employeeService";

const GREEN = "#2e7d32";

const roleColors = {
  customer:           "primary",
  admin:              "error",
  driver:             "success",
  handler:            "success",
  "customer service": "warning",
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

function AdminHomePage() {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch(() => setError("Failed to load admin dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;
  if (error)   return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const { stats, recent_shipments, all_users, pending_requests } = data;

  const filteredUsers = all_users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Stats row */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <StatCard
          icon={<LocalShippingIcon sx={{ fontSize: 32 }} />}
          label="Total shipments"
          value={stats.total_shipments}
        />
        <StatCard
          icon={<AttachMoneyIcon sx={{ fontSize: 32 }} />}
          label="Total revenue"
          value={`$${Number(stats.total_revenue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <StatCard
          icon={<PeopleIcon sx={{ fontSize: 32 }} />}
          label="Total users"
          value={stats.total_users}
          sub={`${stats.total_customers} customers`}
        />
        <StatCard
          icon={<PendingActionsIcon sx={{ fontSize: 32 }} />}
          label="Pending business requests"
          value={stats.pending_requests}
        />
      </Box>

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
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight="bold" color={GREEN}>
                        {s.tracking_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{s.customer_name}</TableCell>
                    <TableCell>{s.receiver_name}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{s.dest_city}, {s.dest_country}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      ${Number(s.total_paid).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "text.secondary", fontSize: 13 }}>
                      {formatDate(s.date_paid)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* All users */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PeopleIcon sx={{ color: GREEN }} />
            <Typography variant="h6" fontWeight="bold">All Users</Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Search by name, email, or role"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            sx={{ width: 280 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
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
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.user_id} hover>
                  <TableCell>{u.name}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{u.email}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{u.phone_num}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.role}
                      color={roleColors[u.role] ?? "default"}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: "text.secondary", py: 3 }}>
                    No users match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default AdminHomePage;