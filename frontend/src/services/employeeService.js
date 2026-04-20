import api from "../api/axios";

export async function getDriverDashboard() {
  const response = await api.get("/api/employee/driver");
  return response.data;
}

export async function getHandlerDashboard() {
  const response = await api.get("/api/employee/handler");
  return response.data;
}

export async function getAdminDashboard() {
  const response = await api.get("/api/employee/admin");
  return response.data;
}