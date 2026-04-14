import api from "../api/axios";

export async function getShippingServices() {
  const response = await api.get("/api/shipping/services");
  return response.data;
}

export async function calculateShippingEstimate(payload) {
  const response = await api.post("/api/shipping/estimate", payload);
  return response.data;
}

export async function getQuote(payload) {
  const response = await api.post("/api/shipping/quote", payload);
  return response.data;
}

export async function startCheckout(payload) {
  const response = await api.post("/api/shipping/payment", payload);
  return response.data;
}

/*
export async function getOrderConfirmation() {
  const response = await api.get()
}*/