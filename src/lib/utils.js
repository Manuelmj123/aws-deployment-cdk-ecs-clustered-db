import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine clsx + tailwind-merge + filter(Boolean)
export function cn(...inputs) {
  return twMerge(clsx(inputs.filter(Boolean)));
}
