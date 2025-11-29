/**
 * Validation utility functions
 */

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is empty or only whitespace
 */
export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Sanitize string by removing HTML tags
 */
export function sanitizeHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Validate minimum string length
 */
export function hasMinLength(str: string, min: number): boolean {
  return str.length >= min;
}

/**
 * Validate maximum string length
 */
export function hasMaxLength(str: string, max: number): boolean {
  return str.length <= max;
}

/**
 * Check if string contains only alphanumeric characters
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Validate password strength
 * Returns: { valid: boolean, issues: string[] }
 */
export function validatePassword(
  password: string
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (password.length < 8) {
    issues.push('Must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('Must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    issues.push('Must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    issues.push('Must contain number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    issues.push('Must contain special character');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Check if value is a valid JSON string
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}