"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-3",
};

export function Spinner({ size = "sm", label, className = "" }: SpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`${sizes[size]} border-primary border-t-transparent rounded-full animate-spin`}
      />
      {label && (
        <span className="text-sm text-muted-foreground">
          {label}
        </span>
      )}
    </span>
  );
}
