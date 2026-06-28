"use client";

type ButtonProps = {
  variant?: "primary" | "secondary" | "tertiary";
  size?: "sm" | "md";
} & React.ComponentProps<"button">;

const variantClasses: Record<string, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 border-transparent",
  secondary:
    "bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-300",
  tertiary:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 border-transparent",
};

const sizeClasses: Record<string, string> = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`font-medium rounded-md border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ""}`}
      {...props}
    />
  );
}
