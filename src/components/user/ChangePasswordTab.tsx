"use client";
import { useState } from "react";

export default function ChangePasswordTab() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới không khớp.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    setLoading(false);
    if (res.ok) {
      setSuccess("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      setError(data.error || "Đổi mật khẩu thất bại.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold mb-2">Đổi mật khẩu</h2>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
      <div>
        <label className="block mb-1 font-medium">Mật khẩu cũ</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Mật khẩu mới</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Xác nhận mật khẩu mới</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 transition"
        disabled={loading}
      >
        {loading ? "Đang đổi..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
} 