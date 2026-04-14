import api from "../api/axios";

export async function getCustomerProfile() {
  const response = await api.get("/api/customer/me");
  return response.data;
}

export async function submitCustomerTypeRequest(businessName, requestInfo) {
  const response = await api.post("/api/customer/request", { businessName, requestInfo });
  return response.data;
}

export async function getMyCustomerTypeRequestStatus() {
  const response = await api.get("/api/customer/request");
  return response.data;
}
