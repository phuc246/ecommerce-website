'use client';

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({ email: "", password: "" });

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
        setErrors({
          email: "Invalid email or password",
          password: "Invalid email or password",
        });
      } else {
        router.push("/");
        router.refresh();
        toast.success("Logged in successfully!");
      }
    } catch (error) {
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={errors.email}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            error={errors.password}
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={loading}
          >
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
} 