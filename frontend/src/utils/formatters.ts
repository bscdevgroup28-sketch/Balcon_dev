/**
 * Shared formatting utilities
 * Consolidates duplicate formatCurrency, formatDate, formatNumber functions
 */

/**
 * Format a number as USD currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format a date to a readable string
 * @param date - The date to format (Date object or ISO string)
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Format a date to include time
 * @param date - The date to format (Date object or ISO string)
 * @returns Formatted datetime string (e.g., "Jan 15, 2025, 3:30 PM")
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Format a number with thousand separators
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string (e.g., "1,234")
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format a percentage
 * @param value - The decimal value to format (e.g., 0.75 for 75%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "75.0%")
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format bytes to human-readable size
 * @param bytes - The number of bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
