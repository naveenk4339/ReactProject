// Mirrors server/src/payment.js so mistakes show before the form is sent.
// The server checks again; this is only for quick feedback.

function passesLuhn(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function cardBrand(digits) {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6(011|5)/.test(digits)) return 'Discover';
  return '';
}

export function validateCard({ name, number, expiry, cvv }, now = new Date()) {
  const errors = {};
  const digits = number.replace(/[\s-]/g, '');

  if (!name.trim()) errors.name = 'Enter the name on the card.';

  if (!/^\d{13,19}$/.test(digits) || !passesLuhn(digits)) {
    errors.number = 'Enter a valid card number.';
  }

  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry.trim());
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) {
    errors.expiry = 'Enter the expiry date as MM/YY.';
  } else {
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      errors.expiry = 'This card has expired.';
    }
  }

  const cvvLength = cardBrand(digits) === 'American Express' ? 4 : 3;
  if (!new RegExp(`^\\d{${cvvLength}}$`).test(cvv)) {
    errors.cvv = `Enter the ${cvvLength}-digit security code.`;
  }

  return errors;
}

// "4242424242424242" -> "4242 4242 4242 4242"
export const formatCardNumber = (value) =>
  value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');

// "1230" -> "12/30"
export function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}
