"use client";

interface VideoBackgroundProps {
  videoSrc: string;
  children: React.ReactNode;
}

export default function VideoBackground({ videoSrc, children }: VideoBackgroundProps) {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
} 