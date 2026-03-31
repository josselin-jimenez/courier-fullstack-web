import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import Navbar from "./components/Navbar";
import UmaHomePage from "./pages/UmaHomePage";
import AdminHomePage from "./pages/AdminHomePage";
import DriverHomePage from "./pages/DriverHomePage";
import HandlerHomePage from "./pages/HandlerHomePage";
import CustomerServiceHomePage from "./pages/CustomerServiceHomePage";
import CustomerHomePage from "./pages/CustomerHomePage";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/UmaHome" element={<PrivateRoute allowedRoles={["uma"]}><UmaHomePage /></PrivateRoute>} />
          <Route path="/AdminHome" element={<PrivateRoute allowedRoles={["admin"]}><AdminHomePage /></PrivateRoute>} />
          <Route path="/DriverHome" element={<PrivateRoute allowedRoles={["driver"]}><DriverHomePage /></PrivateRoute>} />
          <Route path="/HandlerHome" element={<PrivateRoute allowedRoles={["handler"]}><HandlerHomePage /></PrivateRoute>} />
          <Route path="/CustomerServiceHome" element={<PrivateRoute allowedRoles={["customer service"]}><CustomerServiceHomePage /></PrivateRoute>} />
          <Route path="/CustomerHome" element={<PrivateRoute allowedRoles={["customer"]}><CustomerHomePage /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;