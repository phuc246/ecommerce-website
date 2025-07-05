"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "./Navbar";

export default function UserNavigation() {
  return <Navbar />;
} 