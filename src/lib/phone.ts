export function normalizeKoreanPhoneNumber(phone: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");

  // International format: 821012345678 (12 digits) or 82111234567 (11 digits)
  if (
    digits.startsWith("82") &&
    (digits.length === 11 || digits.length === 12 || digits.length === 13)
  ) {
    return `0${digits.slice(2)}`;
  }

  // Standard domestic mobile: 010-1234-5678 (11 digits) or 010-123-4567 / 011-xxx-xxxx (10 digits)
  if (
    digits.startsWith("01") &&
    (digits.length === 10 || digits.length === 11)
  ) {
    return digits;
  }

  // Short format without leading 0: 1012345678 (10 digits) or 101234567 (9 digits)
  if (digits.startsWith("1") && (digits.length === 9 || digits.length === 10)) {
    return `0${digits}`;
  }

  return null;
}

export function isValidKoreanPhoneInput(phone: string): boolean {
  return normalizeKoreanPhoneNumber(phone) !== null;
}

