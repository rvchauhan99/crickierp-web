import { apiClient } from "./apiClient";

export type CreateUserPayload = {
  fullName: string;
  email: string;
  username: string;
  password: string;
  role: "admin" | "sub_admin";
  permissions: string[];
};

export const userService = {
  create: async (payload: CreateUserPayload) => {
    const res = await apiClient.post("/users", payload);
    return res.data;
  },
  list: async () => {
    const res = await apiClient.get("/users");
    return res.data;
  },
  listPermissions: async () => {
    const res = await apiClient.get("/users/permissions");
    return res.data;
  },
};
