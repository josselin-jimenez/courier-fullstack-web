<<<<<<< HEAD
// services/employeeService.js
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
}

export async function getRevenueReport(startDate, endDate) {
  const response = await api.get("/api/employee/admin/revenue", {
    params: { startDate, endDate },
  });
  return response.data;
}

export async function addEmployee(payload) {
  const response = await api.post("/api/employee/admin/add-employee", payload);
  return response.data;
}

export async function editEmployee(userId, payload) {
  const response = await api.patch(`/api/employee/admin/edit/${userId}`, payload);
  return response.data;
}

export async function deleteEmployee(userId) {
  const response = await api.delete(`/api/employee/admin/delete/${userId}`);
  return response.data;
=======
>>>>>>> origin/main
}