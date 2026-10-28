
import axios from "axios";

const api = axios.create({
  baseURL: `http://${window.location.hostname}:4000`,
  withCredentials: true,
});

export default api;
