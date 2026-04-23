// services/scanService.js
import api from "../api/axios";

export async function getPackageStatuses(type) {
  const response = await api.get("/api/scan/statuses", { params: { type } });
  return response.data;
}

export async function searchPackageByTracking(trackingNumber) {
  const response = await api.get("/api/scan/search", { params: { trackingNumber } });
  return response.data;
}

export async function submitHandlerScan(packageId, statusNo) {
  const response = await api.post("/api/scan/handler", { packageId, statusNo });
  return response.data;
}

export async function submitDriverScan(packageId, statusNo, vehicleId) {
  const response = await api.post("/api/scan/driver", { packageId, statusNo, vehicleId: vehicleId || null });
  return response.data;
}

export async function getVehicles() {
  const response = await api.get("/api/scan/vehicles");
  return response.data;
}

export async function editCustomerType(userId, custType, businessName) {
  const response = await api.patch(`/api/scan/admin/customer/${userId}`, { custType, businessName });
  return response.data;
}