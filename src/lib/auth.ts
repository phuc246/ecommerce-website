import type { NextAuthOptions } from "next-auth";

// Add type declarations for NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
  }
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

// Export authOptions from the route file
export { authOptions } from '@/app/api/auth/[...nextauth]/route'; 