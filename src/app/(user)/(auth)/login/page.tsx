"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signIn, useSession } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [videoHeader, setVideoHeader] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      console.log("User is authenticated:", session?.user);
      if (session?.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (data?.value) {
          const settings = JSON.parse(data.value);
          setVideoHeader(settings.videoHeader || "/videos/vecteezy_3d-pink-cylinder-stage-podium-empty-with-flamingo-palm_37998757.mp4");
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting login with:", formData.email);
      
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      console.log("Login result:", result);

      if (result?.error) {
        console.error("Login error:", result.error);
        toast.error(result.error || "Đăng nhập thất bại");
        setIsLoading(false);
        return;
      }

      // Login successful - show toast
      toast.success("Đăng nhập thành công");

      // Lấy role user mới nhất và chuyển hướng chính xác
      try {
        const res = await fetch("/api/profile");
        const user = await res.json();
        if (user.role === "ADMIN") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/";
        }
      } catch (e) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Đăng nhập thất bại");
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // If already authenticated, show loading
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <VideoBackground videoSrc={videoHeader} />
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="max-w-md w-full space-y-8 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Đăng nhập tài khoản
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Địa chỉ email"
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang đăng nhập...
                  </div>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </div>
             <p className="mt-2 text-center text-sm text-gray-600">
              Quên mật khẩu?{" "}
              <Link
                href="#"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Lấy lại mật khẩu
              </Link>
            </p>
          </form>
           <Link href="/register" className="block w-full">
            <button type="button" className="w-full py-3 bg-pink-500/20 text-pink-700 text-sm font-bold rounded-lg shadow-lg hover:bg-pink-500/30 transition-colors">
                Chưa có tài khoản? Đăng ký ngay!
            </button>
          </Link>
        </div>
      </div>
    </>
  );
} 