"use client";
import { useState, useEffect } from "react";

export default function VideoBackgroundAdminPage() {
  const [videoHeader, setVideoHeader] = useState<string>("");
  const [videoBackground, setVideoBackground] = useState<string>("");
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data?.value) {
          const parsed = JSON.parse(data.value);
          setVideoHeader(parsed.videoHeader || "");
          setVideoBackground(parsed.videoBackground || "");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Hàm lưu settings (chỉ lưu 2 trường videoHeader, videoBackground, giữ lại các trường khác nếu có)
  const saveSettings = async (newHeader: string, newBg: string) => {
    // Lấy settings hiện tại
    let currentSettings: any = {};
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data?.value) currentSettings = JSON.parse(data.value);
    } catch {}
    const updated = {
      ...currentSettings,
      videoHeader: newHeader,
      videoBackground: newBg,
    };
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: JSON.stringify(updated) }),
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "header" | "background") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === "header") setUploadingHeader(true);
    else setUploadingBg(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("destination", "videos");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        if (type === "header") {
          setVideoHeader(data.url);
          await saveSettings(data.url, videoBackground);
        } else {
          setVideoBackground(data.url);
          await saveSettings(videoHeader, data.url);
        }
      } else {
        alert("Lỗi upload video");
      }
    } catch {
      alert("Lỗi upload video");
    } finally {
      if (type === "header") setUploadingHeader(false);
      else setUploadingBg(false);
    }
  };

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-pink-600">Quản lý Video Background</h1>
      <div className="space-y-8">
        {/* Video Header */}
        <div>
          <h2 className="text-lg font-medium mb-2">Video Header</h2>
          <label htmlFor="video-header-upload" className="block text-sm font-medium text-gray-700 mb-1">
            Upload video header
          </label>
          <input
            id="video-header-upload"
            type="file"
            accept="video/*"
            onChange={e => handleUpload(e, "header")}
            disabled={uploadingHeader}
          />
          {uploadingHeader && <span className="text-sm text-gray-500">Đang upload...</span>}
          {videoHeader && (
            <div className="mt-2">
              <video src={videoHeader} controls className="w-full max-w-md rounded shadow max-h-[300px]" />
              <button
                type="button"
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 w-fit"
                onClick={async () => { setVideoHeader(""); await saveSettings("", videoBackground); }}
              >
                Xóa video
              </button>
            </div>
          )}
        </div>
        {/* Video Background */}
        <div>
          <h2 className="text-lg font-medium mb-2">Video Background</h2>
          <label htmlFor="video-bg-upload" className="block text-sm font-medium text-gray-700 mb-1">
            Upload video background
          </label>
          <input
            id="video-bg-upload"
            type="file"
            accept="video/*"
            onChange={e => handleUpload(e, "background")}
            disabled={uploadingBg}
          />
          {uploadingBg && <span className="text-sm text-gray-500">Đang upload...</span>}
          {videoBackground && (
            <div className="mt-2">
              <video src={videoBackground} controls className="w-full max-w-md rounded shadow max-h-[300px]" />
              <button
                type="button"
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 w-fit"
                onClick={async () => { setVideoBackground(""); await saveSettings(videoHeader, ""); }}
              >
                Xóa video
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 text-sm text-gray-500">
        <p><b>Lưu ý:</b> Video sẽ được lưu tự động vào cấu hình hệ thống và dùng cho website.</p>
      </div>
    </div>
  );
} 