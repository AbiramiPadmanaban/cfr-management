export const PASSWORD_MIN_LENGTH = 8;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for this email, a password reset link has been sent.";

export const SETUP_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

export function getPasswordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`At least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[A-Z]/.test(password)) {
    issues.push("One uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    issues.push("One lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    issues.push("One number");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    issues.push("One special character");
  }
  return issues;
}

export function getPasswordStrength(password: string): {
  score: number;
  label: "Weak" | "Fair" | "Good" | "Strong";
  issues: string[];
} {
  const issues = getPasswordIssues(password);
  const checks = 5 - issues.length;
  if (!password) {
    return { score: 0, label: "Weak", issues };
  }
  if (checks <= 2) {
    return { score: 1, label: "Weak", issues };
  }
  if (checks === 3) {
    return { score: 2, label: "Fair", issues };
  }
  if (checks === 4) {
    return { score: 3, label: "Good", issues };
  }
  return { score: 4, label: "Strong", issues };
}
