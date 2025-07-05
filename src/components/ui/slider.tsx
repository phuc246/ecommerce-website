import React, { useState, useEffect, useRef } from "react";

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

  return (
    <div className={`relative py-4 ${className || ''}`}>
      <div
        ref={rangeRef}
        className="w-full h-2 bg-gray-200 rounded-full"
      >
        <div
          className="absolute h-2 bg-indigo-600 rounded-full"
          style={{
            left: `${getPercent(localValues[0])}%`,
            width: `${getPercent(localValues[1]) - getPercent(localValues[0])}%`,
          }}
        />
      </div>
      
      {localValues.map((val, index) => (
        <div
          key={index}
          className="absolute w-5 h-5 bg-white border-2 border-indigo-600 rounded-full top-1/2 -mt-2.5 cursor-pointer"
          style={{
            left: `calc(${getPercent(val)}% - 10px)`,
            zIndex: 10,
          }}
          onMouseDown={(e) => handleMouseDown(e, index as 0 | 1)}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={val}
          aria-label={index === 0 ? "Min price" : "Max price"}
          tabIndex={0}
        />
      ))}
    </div>
  );
}; 