"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signIn, useSession } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import VideoBackground from "@/components/VideoBackground";
import { sendPosthogEvent } from '@/lib/utils';
import { motion } from "framer-motion";

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
  const [error, setError] = useState("");
  const formRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
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
    setError("");

    try {
      
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
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
      setError(error instanceof Error ? error.message : "Đăng nhập thất bại");
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
        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0, x: error ? [0, -10, 10, -8, 8, -4, 4, 0] : 0 }}
          transition={{ duration: error ? 0.5 : 0.7, ease: error ? "easeInOut" : "easeOut" }}
          className="max-w-md w-full space-y-8 p-8 bg-white/50 border border-white/40 backdrop-blur-lg rounded-3xl shadow-2xl"
        >
          <motion.h2
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="text-center text-3xl font-extrabold mb-8 bg-gradient-to-r from-pink-400 via-fuchsia-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg"
          >
            Đăng nhập tài khoản
          </motion.h2>
          <motion.form
            className="space-y-6"
            onSubmit={handleSubmit}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } }
            }}
          >
            <motion.div variants={{ hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } }}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all shadow-sm text-gray-900 bg-white/90 mb-2"
                placeholder="Địa chỉ email"
              />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }} className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all shadow-sm text-gray-900 bg-white/90 pr-12 mb-2"
                placeholder="Mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                tabIndex={-1}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </motion.div>
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-300 to-fuchsia-500 text-white font-bold shadow-lg transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed ripple flex justify-center items-center min-h-[48px]"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </motion.button>
          </motion.form>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-red-500 font-bold mt-2"
            >
              {error}
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex flex-col gap-2 mt-2">
              <div className="text-center text-sm text-gray-500">
                Quên mật khẩu? <Link href="/forgot-password" className="text-blue-500 hover:underline">Lấy lại mật khẩu</Link>
              </div>
              <Link href="/register" className="block w-full">
                <button type="button" className="w-full py-3 bg-pink-500/20 text-pink-700 text-sm font-bold rounded-xl shadow-lg hover:bg-pink-500/30 transition-colors mt-2">
                  Chưa có tài khoản? Đăng ký ngay!
                </button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
} 