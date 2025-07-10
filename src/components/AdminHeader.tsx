"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { ChevronDown, LogOut, Home, User, Settings, Tag } from "lucide-react";

export default function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 max-w-screen-md mx-auto border-b bg-pink-100 backdrop-blur-sm shadow-lg rounded-bl-full rounded-br-full">
      <div className="flex h-14 items-center px-8 md:px-16 relative w-full justify-between">
        <div className="flex items-center min-w-[180px]">
          <span className="text-lg font-semibold text-pink-500 pl-2">
            Xin chào {session?.user?.name || "admin"}
          </span>
        </div>
        <div className="flex-1" />
        {session?.user && (
          <div className="flex flex-col items-end">
            <span className="text-base md:text-lg font-bold bg-gradient-to-r from-pink-400 via-fuchsia-500 to-pink-600 bg-clip-text text-transparent animate-gradient-x drop-shadow-lg">
              {session.user.email}
            </span>
          </div>
        )}
      </div>
    </header>
  );
} 