// Returns an error string if invalid, or "" if valid.

const ARABIC_RE = /[؀-ۿݐ-ݿࢠ-ࣿ]/;
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string {
  const v = value.trim();
  if (!v) return "Email is required.";
  if (ARABIC_RE.test(v)) return "Email must be in English characters only.";
  if (!EMAIL_RE.test(v)) return "Please enter a valid email address.";
  return "";
}

export function validatePassword(value: string): string {
  if (!value) return "Password is required.";
  if (value.length < 6) return "Password must be at least 6 characters.";
  return "";
}

export function validateConfirmPassword(value: string, password: string): string {
  if (!value) return "Please confirm your password.";
  if (value !== password) return "Passwords do not match.";
  return "";
}

// Allows Arabic letters, English letters, and spaces only
const NAME_VALID_RE   = /^[؀-ۿa-zA-Z\s]+$/;
const NAME_INVALID_RE = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/;

export function validateName(value: string): string {
  const v = value.trim();
  if (!v) return "Full name is required.";
  if (v.length < 2) return "Name must be at least 2 characters.";
  if (NAME_INVALID_RE.test(v)) return "Name must not contain numbers or special characters.";
  if (!NAME_VALID_RE.test(v)) return "Name may only contain Arabic or English letters.";
  return "";
}

export function validateHeight(value: string): string {
  const v = value.trim();
  if (!v) return "";                             // optional field
  if (ARABIC_RE.test(v) || /[^\d.]/.test(v)) return "Height must be a number (cm).";
  const n = parseFloat(v);
  if (isNaN(n) || n < 100 || n > 250) return "Enter a realistic height (100–250 cm).";
  return "";
}

export function validateWeight(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (ARABIC_RE.test(v) || /[^\d.]/.test(v)) return "Weight must be a number (kg).";
  const n = parseFloat(v);
  if (isNaN(n) || n < 20 || n > 300) return "Enter a realistic weight (20–300 kg).";
  return "";
}

export function validateMeasurementCm(label: string, value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (ARABIC_RE.test(v) || /[^\d.]/.test(v)) return `${label} must be a number (cm).`;
  const n = parseFloat(v);
  if (isNaN(n) || n < 30 || n > 200) return `Enter a realistic ${label.toLowerCase()} (30–200 cm).`;
  return "";
}

export function validateSize(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (ARABIC_RE.test(v)) return "Size must use English letters (e.g. S, M, L, XL or 38).";
  return "";
}
