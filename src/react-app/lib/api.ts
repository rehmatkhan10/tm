import axios from "axios";

export const api = axios.create({
  baseURL: typeof window !== "undefined" ? window.location.origin : "/",
  withCredentials: true, // Send cookies with requests (better-auth uses session cookies)
});
