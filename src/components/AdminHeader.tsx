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
      <div className="flex h-14 items-center px-8 md:px-16 relative w-full">
        <div className="flex items-center min-w-[180px]">
          <span className="text-lg font-semibold text-pink-500 pl-2">
            Xin chào {session?.user?.name || "admin"}
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center">
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-pink-500 hover:text-pink-600">
                  <User className="h-5 w-5 rounded-full" />
                  <span className="hidden md:inline">{session.user.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name || "Admin"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
} 