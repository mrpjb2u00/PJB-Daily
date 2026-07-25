export interface BirthdayParts {
  month: number;
  day: number;
}

export interface ProfileInput {
  firstName: string;
  username: string;
  birthday?: BirthdayParts | null;
}

export interface ProfileValidationResult {
  valid: boolean;
  firstName?: string;
  username?: string;
  birthdayMonth?: number | null;
  birthdayDay?: number | null;
  error?: string;
}

export const FIRST_NAME_MAX_LENGTH = 50;
export const USERNAME_MIN_LENGTH = 3;

const DAYS_BY_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isValidBirthday(month: number, day: number): boolean {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= DAYS_BY_MONTH[month - 1];
}

export function formatBirthday(month?: number | null, day?: number | null): string {
  if (!month || !day || !isValidBirthday(month, day)) return 'Not set';
  const date = new Date(2024, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function validateProfileInput(input: ProfileInput): ProfileValidationResult {
  const firstName = input.firstName.trim();
  const username = input.username.trim().toLowerCase();
  const birthday = input.birthday ?? null;

  if (!firstName) {
    return { valid: false, error: 'Please enter your first name' };
  }
  if (firstName.length > FIRST_NAME_MAX_LENGTH) {
    return { valid: false, error: `First name must be ${FIRST_NAME_MAX_LENGTH} characters or less` };
  }
  if (!username) {
    return { valid: false, error: 'Please enter a username' };
  }
  if (username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (!birthday) {
    return {
      valid: true,
      firstName,
      username,
      birthdayMonth: null,
      birthdayDay: null,
    };
  }

  if (!isValidBirthday(birthday.month, birthday.day)) {
    return { valid: false, error: 'Please enter a valid birthday month and day' };
  }

  return {
    valid: true,
    firstName,
    username,
    birthdayMonth: birthday.month,
    birthdayDay: birthday.day,
  };
}
