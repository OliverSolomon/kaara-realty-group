// @ts-nocheck -- vendored from Canvix (MIT). See vendor/canvix/README.md.
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
