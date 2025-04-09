"use client";

import { useEffect, useRef } from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
}

export default function VideoBackground({ videoSrc }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[-1]">
      <video
        ref={videoRef}
        className="absolute min-w-full min-h-full object-cover video-background"
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          boxShadow: 'none'
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
} 