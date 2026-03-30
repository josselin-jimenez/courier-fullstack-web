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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/UmaHome" element={<UmaHomePage />} />
          <Route path="/AdminHome" element={<AdminHomePage />} />
          <Route path="/DriverHome" element={<DriverHomePage />} />
          <Route path="/HandlerHome" element={<HandlerHomePage />} />
          <Route path="/CustomerServiceHome" element={<CustomerServiceHomePage />} />
          <Route path="/CustomerHome" element={<CustomerHomePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;