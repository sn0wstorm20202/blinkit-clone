import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeProductImageUrl(url: string | null | undefined, name: string) {
  // If URL is empty, show a placeholder with the product name
  if (!url || url.trim().length === 0) {
    return `https://via.placeholder.com/480x480?text=${encodeURIComponent(name)}`
  }

  return url
}
