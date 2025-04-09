import { useState, useEffect, RefObject } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

export const useMouseMove = (ref: RefObject<HTMLElement>, intensity: number = 0.15) => {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isHovered) return;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const moveX = (e.clientX - centerX) * intensity;
      const moveY = (e.clientY - centerY) * intensity;

      requestAnimationFrame(() => {
        setPosition({ x: moveX, y: moveY });
      });
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      setPosition({ x: 0, y: 0 });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, intensity, isHovered]);

  return {
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
  };
}; 