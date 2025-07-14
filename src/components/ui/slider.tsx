import React, { useState, useEffect, useRef } from "react";
import './slider.css';

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  min,
  max,
  step = 1,
  value,
  defaultValue = [min, max],
  onValueChange,
  className,
}) => {
  const [localValues, setLocalValues] = useState<number[]>(value || defaultValue);
  const rangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setLocalValues(value);
    }
  }, [value]);

  const getPercent = (value: number) => {
    return Math.round(((value - min) / (max - min)) * 100);
  };

  const handleMouseDown = (e: React.MouseEvent, thumb: 0 | 1) => {
    e.preventDefault();
    
    const startX = e.clientX;
    const rangeWidth = rangeRef.current ? rangeRef.current.getBoundingClientRect().width : 0;
    const initialValue = localValues[thumb];
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaValue = (deltaX / rangeWidth) * (max - min);
      
      const newValue = Math.min(
        Math.max(
          Math.round((initialValue + deltaValue) / step) * step,
          min
        ),
        max
      );
      
      const newValues = [...localValues];
      
      if (thumb === 0 && newValue <= localValues[1]) {
        newValues[0] = newValue;
      } else if (thumb === 1 && newValue >= localValues[0]) {
        newValues[1] = newValue;
      }
      
      setLocalValues(newValues);
      onValueChange?.(newValues);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Tính toán giá trị phần trăm cho các biến CSS
  const sliderVars = {
    '--slider-bar-left': `${getPercent(localValues[0])}%`,
    '--slider-bar-width': `${getPercent(localValues[1]) - getPercent(localValues[0])}%`,
    '--slider-thumb-left-0': `${getPercent(localValues[0])}%`,
    '--slider-thumb-left-1': `${getPercent(localValues[1])}%`,
  };

  useEffect(() => {
    if (rangeRef.current) {
      rangeRef.current.style.setProperty('--slider-bar-left', `${getPercent(localValues[0])}%`);
      rangeRef.current.style.setProperty('--slider-bar-width', `${getPercent(localValues[1]) - getPercent(localValues[0])}%`);
      rangeRef.current.style.setProperty('--slider-thumb-left-0', `${getPercent(localValues[0])}%`);
      rangeRef.current.style.setProperty('--slider-thumb-left-1', `${getPercent(localValues[1])}%`);
    }
  }, [localValues]);

  return (
    <div className={`relative py-4 ${className || ''}`}>
      <div
        className={`absolute w-full h-2 bg-gray-200 rounded-full slider-root slider-vars`}
        ref={rangeRef}
        // style={sliderVars as React.CSSProperties}
      >
        <div
          className="absolute bg-indigo-600 rounded-full slider-bar"
        />
      </div>
      
      {localValues.map((val, index) => (
          <div
            key={index}
          className="absolute w-5 h-5 bg-white border-2 border-indigo-600 rounded-full top-1/2 -mt-2.5 cursor-pointer slider-thumb"
          data-index={index}
            onMouseDown={(e) => handleMouseDown(e, index as 0 | 1)}
            tabIndex={0}
          />
      ))}
    </div>
  );
}; 