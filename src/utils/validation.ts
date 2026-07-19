// Shared client-side validation for the business fields that are synced between
// the Business Profile and QR Payment pages. The same rules are enforced
// server-side in PATCH /api/business-profile.

export interface BusinessFields {
  businessName: string;
  phone: string;
  upiId: string;
}

export type BusinessFieldErrors = Partial<Record<keyof BusinessFields, string>>;

const UPI_RE = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/;

export function formatBusinessUpdatedAt(value: string | null | undefined): string {
  if (!value) return 'Not saved yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function validateBusinessProfile(f: Partial<BusinessFields>): BusinessFieldErrors {
  const errors: BusinessFieldErrors = {};

  if (f.businessName !== undefined && !f.businessName.trim()) {
    errors.businessName = 'Business name is required';
  }

  if (f.upiId !== undefined) {
    const upi = f.upiId.trim();
    if (!upi) errors.upiId = 'UPI ID is required';
    else if (!UPI_RE.test(upi)) errors.upiId = 'Enter a valid UPI ID (e.g. name@bank)';
  }

  if (f.phone !== undefined) {
    const digits = f.phone.replace(/\D/g, '');
    if (!digits) errors.phone = 'Phone number is required';
    else if (digits.length < 10) errors.phone = 'Enter a valid 10-digit phone number';
  }

  return errors;
}
