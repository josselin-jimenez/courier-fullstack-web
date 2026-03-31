import axios from "../api/axios";

//POST's { email, password } to /api/auth/login
export async function loginUser(email, password) {
  const response = await axios.post("/api/auth/login", { email, password });
  return response.data.token;
}