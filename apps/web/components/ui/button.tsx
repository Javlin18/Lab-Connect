import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "outline" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2",
  icon: "h-10 w-10",
  lg: "h-11 px-8",
  sm: "h-9 px-3"
};

export function buttonVariants({
  className,
  size = "default",
  variant = "default"
}: Pick<ButtonProps, "className" | "size" | "variant"> = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );
}

export function Button({
  className,
  size = "default",
  variant = "default",
  ...props
}: ButtonProps) {
  return <button className={buttonVariants({ className, size, variant })} {...props} />;
}
