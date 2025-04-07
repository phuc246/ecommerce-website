import VideoBackground from "@/components/VideoBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <VideoBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        {children}
      </div>
    </div>
  );
} 