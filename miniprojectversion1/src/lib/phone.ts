export function formatIndianPhoneNumber(value?: string | null): string {
  const input = value?.trim();
  if (!input) return '';
  if (input.startsWith('+91 ')) return input;

  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    const nationalNumber = digits.slice(1);
    return `+91 ${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    const nationalNumber = digits.slice(2);
    return `+91 ${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`;
  }

  if (input.startsWith('+91')) {
    return `+91 ${digits.slice(2)}`;
  }

  return input;
}

export function toIndianTelHref(value?: string | null): string {
  return formatIndianPhoneNumber(value).replace(/\s/g, '');
}