import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeString(s: string | null | undefined): string {
  if (!s) return "";
  
  // Convert to string in case we get a number or other type
  const str = String(s);
  
  return str
    // Convert to lowercase
    .toLowerCase()
    // Replace special characters with spaces
    .replace(/[^\w\s]/g, ' ')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Trim spaces from ends
    .trim();
}
