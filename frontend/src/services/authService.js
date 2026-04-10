import axios from "../api/axios";

//POST's { email, password } to /api/auth/login
export async function loginUser(email, password) {
  const response = await axios.post("/api/auth/login", { email, password });
  return response.data.token; // returns token given by server
}

export async function registerUser(name, email, password, phone, custAddress) {
  const response = await axios.post("/api/auth/register", { name, email, password, phone, custAddress });
  return response.data;
}