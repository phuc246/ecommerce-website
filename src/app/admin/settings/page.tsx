"use client";

import { useState, useEffect } from "react";

interface SettingsData {
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    siteName: "E-commerce Website",
    contactEmail: "",
    contactPhone: "",
    address: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      if (data?.value) {
        setSettings(JSON.parse(data.value));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: JSON.stringify(settings) }),
      });

      if (!response.ok) throw new Error("Failed to update settings");
      
      alert("Settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Failed to update settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof SettingsData
  ) => {
    setSettings({
      ...settings,
      [field]: e.target.value,
    });
  };

  const handleSocialMediaChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof settings.socialMedia
  ) => {
    setSettings({
      ...settings,
      socialMedia: {
        ...settings.socialMedia,
        [field]: e.target.value,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Cài đặt trang web</h1>
      
      <div className="max-w-3xl bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium mb-4">Thông tin cơ bản</h2>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="site-name" className="block text-sm font-medium text-gray-700">
                    Tên website
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="site-name"
                      value={settings.siteName}
                      onChange={(e) => handleInputChange(e, "siteName")}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">
                    Email liên hệ
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      id="contact-email"
                      value={settings.contactEmail}
                      onChange={(e) => handleInputChange(e, "contactEmail")}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700">
                    Số điện thoại liên hệ
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="contact-phone"
                      value={settings.contactPhone}
                      onChange={(e) => handleInputChange(e, "contactPhone")}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Địa chỉ
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="address"
                      value={settings.address}
                      onChange={(e) => handleInputChange(e, "address")}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium mb-4">Mạng xã hội</h2>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
                    Facebook
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      id="facebook"
                      value={settings.socialMedia.facebook}
                      onChange={(e) => handleSocialMediaChange(e, "facebook")}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="https://facebook.com/your-page"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
                    Instagram
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      id="instagram"
                      value={settings.socialMedia.instagram}
                      onChange={(e) => handleSocialMediaChange(e, "instagram")}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="https://instagram.com/your-profile"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                    Twitter
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      id="twitter"
                      value={settings.socialMedia.twitter}
                      onChange={(e) => handleSocialMediaChange(e, "twitter")}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="https://twitter.com/your-profile"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              type="submit"
              disabled={isSaving}
              className={`py-2 px-4 rounded-md font-medium ${
                isSaving
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 