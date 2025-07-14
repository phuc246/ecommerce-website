import NextAuth, { NextAuthOptions, User } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Adapter } from "next-auth/adapters";

const authOptions: NextAuthOptions = {
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
            throw new Error("Vui lòng nhập email và mật khẩu");
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user) {
            throw new Error("Email hoặc mật khẩu không đúng");
          }

          if (!user.password) {
            throw new Error("Tài khoản chưa có mật khẩu");
          }

          let passwordMatch;
          try {
            passwordMatch = await bcrypt.compare(
              credentials.password,
              user.password
            );
          } catch (error) {
            throw new Error("Lỗi xác thực mật khẩu");
          }

          if (!passwordMatch) {
            throw new Error("Email hoặc mật khẩu không đúng");
          }

          return {
            id: user.id,
            email: user.email || "",
            name: user.name || "",
            role: user.role,
          } as User;
        } catch (error) {
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
export { authOptions };