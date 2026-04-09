import axios from "axios";
import { AxiosRequestConfig } from "axios";
import { clearSessionStore, getAccessToken, setAccessToken } from "./sessionStore";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",
  timeout: 12000,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;
    try {
      const refreshResponse = await apiClient.post("/auth/refresh", {});
      const nextToken = refreshResponse?.data?.data?.accessToken;
      if (!nextToken) throw new Error("Missing refreshed access token");
      setAccessToken(nextToken);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${nextToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearSessionStore();
      return Promise.reject(refreshError);
    }
  },
);
