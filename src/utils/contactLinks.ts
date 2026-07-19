// Shared links for the Website Builder preview and published customer website.

function phoneDigits(phone?: string | null): string {
  return String(phone || '').replace(/\D/g, '');
}

export function callHref(phone?: string | null): string | null {
  const raw = String(phone || '').trim();
  const digits = phoneDigits(raw);
  if (!digits) return null;
  return `tel:${raw.startsWith('+') ? '+' : ''}${digits}`;
}

export function whatsappHref(phone?: string | null): string | null {
  let digits = phoneDigits(phone);
  if (!digits) return null;
  // SahAI serves Indian vendors; WhatsApp requires a country code.
  if (digits.length === 10) digits = `91${digits}`;
  const message = encodeURIComponent('Hi, I found your business on SahAI.');
  const base = 'https:' + '//wa.me/';
  return base + digits + '?text=' + message;
}

export function directionsHref(location?: string | null): string | null {
  const query = String(location || '').trim();
  if (!query) return null;
  const base = 'https:' + '//www.google.com/maps/search/?api=1&query=';
  return base + encodeURIComponent(query);
}
