import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

const navConfig = {
  customer: [
    { label: "Home", to: "/" },
    { label: "Dashboard", to: "/CustomerHome" },
    { label: "Track", to: "/track" },
    { label: "Ship a Package", to: "/ship" },
  ],
  driver: [
  { label: "Dashboard", to: "/DriverHome" },
  { label: "Scan", to: "/driver-scan" },
  { label: "Track", to: "/track" },
  ],
  handler: [
  { label: "Dashboard", to: "/HandlerHome" },
  { label: "Scan", to: "/handler-scan" },
  { label: "Track", to: "/track" },
  ],
  admin: [
    { label: "Dashboard", to: "/AdminHome" },
    { label: "Track", to: "/track" },
  ],
  "customer service": [
    { label: "Dashboard", to: "/CustomerServiceHome" },
    { label: "Track", to: "/track" },
  ],
  guest: [
    { label: "Home", to: "/" },
    { label: "Track", to: "/track" },
    { label: "Get Estimate", to: "/ShippingCalculator" },
    { label: "Login", to: "/login" },
    { label: "Register", to: "/register" },
  ],
};

const employeeRoles = ["driver", "handler", "admin", "customer service"];

function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const role = token && user ? user.role : "guest";
  const links = navConfig[role] ?? navConfig.guest;
  const navColor = employeeRoles.includes(role) ? "#2e7d32" : "#215bb1";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: navColor }}>
      <Toolbar>
        <LocalShippingIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
          {token && user
            ? `${user.name} | ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` //DB names are lower case
            : "Team 10 - Courier System"}
        </Typography>
        {links.map(({ label, to }) => (
          <Button key={label} color="inherit" component={Link} to={to}>
            {label}
          </Button>
        ))}
        {token && (
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
