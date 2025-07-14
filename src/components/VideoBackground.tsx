"use client";

import { motion } from 'framer-motion';
import React from 'react';

interface VideoBackgroundProps {
  videoSrc: string;
}

export default function VideoBackground({ videoSrc }: VideoBackgroundProps) {
  return (
    <motion.video
      src={videoSrc}
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      className="w-full h-full object-cover absolute inset-0 z-0"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    />
  );
} 