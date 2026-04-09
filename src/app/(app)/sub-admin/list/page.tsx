"use client";

import { useEffect, useState } from "react";
import { userService } from "@/services/userService";

type UserRow = {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
  status: string;
};

export default function SubAdminListPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService
      .list()
      .then((res) => setRows(res?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Sub Admin List</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Username</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-t">
                  <td className="p-2">{row.fullName}</td>
                  <td className="p-2">{row.email}</td>
                  <td className="p-2">{row.username}</td>
                  <td className="p-2">{row.role}</td>
                  <td className="p-2">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
