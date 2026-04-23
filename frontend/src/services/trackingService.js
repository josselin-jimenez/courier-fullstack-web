import api from "../api/axios";

export async function getTracking(trackingNumber) {
  const response = await api.get(`/api/tracking/${trackingNumber}`);
  return response.data;
}