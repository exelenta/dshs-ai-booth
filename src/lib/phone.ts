export function normalizeKoreanPhoneNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");

  // International format: 821012345678 or 82111234567
  if (
    digits.startsWith("82") &&
    (digits.length === 11 || digits.length === 12 || digits.length === 13)
  ) {
    return `+${digits}`;
  }

  // Standard domestic mobile: 010-1234-5678 (11 digits) or 010-123-4567 / 011-xxx-xxxx (10 digits)
  if (
    digits.startsWith("01") &&
    (digits.length === 10 || digits.length === 11)
  ) {
    return `+82${digits.slice(1)}`;
  }

  // Short format without leading 0: 1012345678 (10 digits) or 101234567 (9 digits)
  if (digits.startsWith("1") && (digits.length === 9 || digits.length === 10)) {
    return `+82${digits}`;
  }

  return null;
}

export function isValidKoreanPhoneInput(phone: string): boolean {
  return normalizeKoreanPhoneNumber(phone) !== null;
}
