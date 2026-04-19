import { BrowserRouter, Routes, Route } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthProvider, useAuth } from "./context/authContext";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Navbar from "./components/Navbar";
import UmaHomePage from "./pages/UmaHomePage";
import AdminHomePage from "./pages/AdminHomePage";
import DriverHomePage from "./pages/DriverHomePage";
import HandlerHomePage from "./pages/HandlerHomePage";
import CustomerServiceHomePage from "./pages/CustomerServiceHomePage";
import CustomerHomePage from "./pages/CustomerHomePage";
import ShippingCalculatorPage from "./pages/ShippingCalculatorPage";
import CustomerShippingPage from "./pages/CustomerShippingPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";

const employeeRoles = ["driver", "handler", "admin", "customer service", "uma"];

function ThemedApp() {
  const { user } = useAuth();
  const isEmployee = user && employeeRoles.includes(user.role);

  const theme = createTheme({
    palette: {
      primary: { main: isEmployee ? "#2e7d32" : "#215bb1" },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/ShippingCalculator" element={<PublicRoute><ShippingCalculatorPage /></PublicRoute>} />
          <Route path="/UmaHome" element={<PrivateRoute allowedRoles={["uma"]}><UmaHomePage /></PrivateRoute>} />
          <Route path="/AdminHome" element={<PrivateRoute allowedRoles={["admin"]}><AdminHomePage /></PrivateRoute>} />
          <Route path="/DriverHome" element={<PrivateRoute allowedRoles={["driver"]}><DriverHomePage /></PrivateRoute>} />
          <Route path="/HandlerHome" element={<PrivateRoute allowedRoles={["handler"]}><HandlerHomePage /></PrivateRoute>} />
          <Route path="/CustomerServiceHome" element={<PrivateRoute allowedRoles={["customer service"]}><CustomerServiceHomePage /></PrivateRoute>} />
          <Route path="/CustomerHome" element={<PrivateRoute allowedRoles={["customer"]}><CustomerHomePage /></PrivateRoute>} />
          <Route path="/ship" element={<PrivateRoute allowedRoles={["customer"]}><CustomerShippingPage /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute allowedRoles={["customer"]}><CheckoutPage /></PrivateRoute>} />
          <Route path="/order-confirmation" element={<PrivateRoute allowedRoles={["customer"]}><OrderConfirmationPage /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemedApp />
    </AuthProvider>
  );
}

export default App;