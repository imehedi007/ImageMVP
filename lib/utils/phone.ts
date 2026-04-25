export function normalizeBangladeshPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");

  if (digits.startsWith("8801") && digits.length === 13) {
    return digits;
  }

  if (digits.startsWith("01") && digits.length === 11) {
    return `88${digits}`;
  }

  throw new Error("Enter a valid Bangladesh mobile number.");
}

export function isValidBangladeshPhone(raw: string) {
  try {
    normalizeBangladeshPhone(raw);
    return true;
  } catch {
    return false;
  }
}
