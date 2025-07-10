import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses = {
  default: "bg-pink-500 text-white hover:bg-pink-600",
  outline: "border border-pink-500 text-pink-500 bg-white hover:bg-pink-50",
  ghost: "bg-transparent hover:bg-pink-100 text-pink-600",
  link: "bg-transparent underline text-pink-600 hover:text-pink-800",
  destructive: "bg-red-500 text-white hover:bg-red-600",
};

const sizeClasses = {
  default: "h-10 px-4 py-2 text-base",
  sm: "h-8 px-3 py-1 text-sm",
  lg: "h-12 px-6 py-3 text-lg",
  icon: "h-10 w-10 p-0 flex items-center justify-center",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "default", size = "default", loading, leftIcon, rightIcon, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none gap-2",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button; 