import NextAuth, { NextAuthOptions, User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            throw new Error("Vui lòng nhập email và mật khẩu");
          }

          console.log("Looking for user with email:", credentials.email);
          
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user) {
            console.log("User not found:", credentials.email);
            throw new Error("Email hoặc mật khẩu không đúng");
          }

          if (!user.password) {
            console.log("User has no password:", user.email);
            throw new Error("Tài khoản chưa có mật khẩu");
          }

          console.log("User found:", user.email, "Role:", user.role);
          console.log("Password hash:", user.password ? user.password.substring(0, 10) + "..." : "none");
          console.log("Comparing with entered password length:", credentials.password.length);
          
          let passwordMatch;
          try {
            // For admin@example.com with password 123456
            if (credentials.email === "admin@example.com" && credentials.password === "123456") {
              console.log("Testing admin login with default password...");
            }
            
            passwordMatch = await bcrypt.compare(
              credentials.password,
              user.password
            );
            
            console.log("Password match result:", passwordMatch);
          } catch (error) {
            console.error("Password comparison error:", error);
            throw new Error("Lỗi xác thực mật khẩu");
          }

          if (!passwordMatch) {
            console.log("Password doesn't match for user:", user.email);
            throw new Error("Email hoặc mật khẩu không đúng");
          }

          console.log("Login successful for:", user.email, "with role:", user.role);
          return {
            id: user.id,
            email: user.email || "",
            name: user.name || "",
            role: user.role,
          } as User;
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      };
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 