"use client";
import { useState, useEffect } from "react";

export default function VideoBackgroundAdminPage() {
  const [videoHeader, setVideoHeader] = useState<string>("");
  const [videoBackground, setVideoBackground] = useState<string>("");
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [headerProgress, setHeaderProgress] = useState(0);
  const [bgProgress, setBgProgress] = useState(0);
  const [message, setMessage] = useState("");
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
    // Lấy settings hiện tại từ server (luôn luôn fetch mới)
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

  // Hàm fetch lại settings và cập nhật state
  const refreshSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data?.value) {
        const parsed = JSON.parse(data.value);
        setVideoHeader(parsed.videoHeader || "");
        setVideoBackground(parsed.videoBackground || "");
      }
    } catch {}
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "header" | "background") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage("");
    if (type === "header") {
      setUploadingHeader(true);
      setHeaderProgress(0);
    } else {
      setUploadingBg(true);
      setBgProgress(0);
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("destination", "videos");
    try {
      // Sử dụng XMLHttpRequest để theo dõi tiến trình upload
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload", true);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded * 100) / event.total);
            if (type === "header") setHeaderProgress(percent);
            else setBgProgress(percent);
          }
        };
        xhr.onload = async function () {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.url) {
                // Lấy settings mới nhất trước khi lưu
                let currentHeader = videoHeader;
                let currentBg = videoBackground;
                try {
                  const res = await fetch("/api/admin/settings");
                  const settingsData = await res.json();
                  if (settingsData?.value) {
                    const parsed = JSON.parse(settingsData.value);
                    currentHeader = parsed.videoHeader || "";
                    currentBg = parsed.videoBackground || "";
                  }
                } catch {}
                if (type === "header") {
                  await saveSettings(data.url, currentBg);
                } else {
                  await saveSettings(currentHeader, data.url);
                }
                setMessage("Upload thành công!");
                if (type === "header") setHeaderProgress(100);
                else setBgProgress(100);
                // Fetch lại settings để cập nhật state mới nhất
                await refreshSettings();
                resolve();
              } else {
                setMessage("Lỗi upload video");
                reject();
              }
            } catch {
              setMessage("Lỗi upload video");
              reject();
            }
          } else {
            setMessage("Lỗi upload video");
            reject();
          }
        };
        xhr.onerror = function () {
          setMessage("Có lỗi khi upload!");
          reject();
        };
        xhr.send(formData);
      });
    } catch {
      // Đã set message ở trên
    } finally {
      if (type === "header") setUploadingHeader(false);
      else setUploadingBg(false);
      setTimeout(() => setMessage(""), 3000);
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
          {uploadingHeader && (
            <div className="w-full max-w-md my-2">
              <div className="bg-gray-200 rounded h-2 overflow-hidden">
                {/* eslint-disable-next-line react/style-prop-object */}
                <div
                  className="bg-pink-500 h-2 transition-all duration-200"
                  style={{ width: headerProgress + '%' }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">Đang upload: {headerProgress}%</div>
            </div>
          )}
          {message && (
            <div className={`mt-2 text-sm ${message.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>{message}</div>
          )}
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
          {uploadingBg && (
            <div className="w-full max-w-md my-2">
              <div className="bg-gray-200 rounded h-2 overflow-hidden">
                {/* eslint-disable-next-line react/style-prop-object */}
                <div
                  className="bg-pink-500 h-2 transition-all duration-200"
                  style={{ width: bgProgress + '%' }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">Đang upload: {bgProgress}%</div>
            </div>
          )}
          {message && (
            <div className={`mt-2 text-sm ${message.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>{message}</div>
          )}
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