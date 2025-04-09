import { useEffect, useState, useRef } from 'react';

interface Category {
  id: string;
  name: string;
  image?: string;
}

export const useCategoryScroll = (categories: Category[], autoScroll: boolean = true, speed: number = 0.5) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left
  const animationRef = useRef<number | null>(null);
  
  // Function to animate the scroll
  const scrollAnimation = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      // Change direction when reaching the edges
      if (scrollPosition >= maxScroll - 1) {
        setDirection(-1);
      } else if (scrollPosition <= 0) {
        setDirection(1);
      }
      
      const newPosition = scrollPosition + speed * direction;
      setScrollPosition(newPosition);
      container.scrollLeft = newPosition;
      
      animationRef.current = requestAnimationFrame(scrollAnimation);
    }
  };
  
  // Start/stop auto-scrolling effect
  useEffect(() => {
    if (!autoScroll || isHovering || isPaused || !containerRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    animationRef.current = requestAnimationFrame(scrollAnimation);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isHovering, isPaused, autoScroll, direction, scrollPosition]);
  
  // Reset animation when categories change
  useEffect(() => {
    if (containerRef.current && categories.length > 0) {
      setScrollPosition(0);
      containerRef.current.scrollLeft = 0;
    }
  }, [categories]);
  
  // Mouse interaction handlers
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);
  const handleScroll = () => {
    if (containerRef.current) {
      setScrollPosition(containerRef.current.scrollLeft);
    }
  };
  
  const pauseAnimation = () => setIsPaused(true);
  const resumeAnimation = () => setIsPaused(false);
  
  return {
    containerRef,
    handleMouseEnter,
    handleMouseLeave,
    handleScroll,
    pauseAnimation,
    resumeAnimation,
    scrollPosition
  };
}; 