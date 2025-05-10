import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as currency
 * @param value Number to format
 * @param currency Currency code (e.g., 'USD')
 * @param abbreviate Whether to abbreviate large numbers
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'USD', abbreviate: boolean = false): string {
  if (abbreviate && value >= 1_000_000) {
    if (value >= 1_000_000_000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 1,
      }).format(value / 1_000_000_000) + 'B'
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 1,
      }).format(value / 1_000_000) + 'M'
    }
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formats a number as percentage
 * @param value Number to format (e.g., 0.05 for 5%)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formats a number with commas for thousands
 * @param value Number to format
 * @returns Formatted number string with commas
 */
export function formatNumberWithCommas(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
