import axios from "../api/axios";

export async function getMyCustomerTypeRequestStatus() {
  const response = await axios.get("/api/customer-type-requests/me");
  return response.data;
}

export async function submitCustomerTypeRequest(requestReason) {
  const response = await axios.post("/api/customer-type-requests", {
    requestReason
  });
  return response.data;
}