export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 9 && digits.startsWith("9")) {
    return `244${digits}`;
  }

  if (digits.startsWith("00") && digits.length > 4) {
    return digits.slice(2);
  }

  return digits;
}

export function isValidPhone(input: string): boolean {
  const phone = normalizePhone(input);
  return phone.length >= 9 && phone.length <= 15;
}
