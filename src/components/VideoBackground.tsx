"use client";

import { ReactNode } from "react";

interface VideoBackgroundProps {
  children: ReactNode;
  videoSrc?: string;
}

export default function VideoBackground({
  children,
  videoSrc = "/videos/background.mp4",
}: VideoBackgroundProps) {
  return (
    <div className="relative h-screen">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: -1,
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      {children}
    </div>
  );
} 