import { Product } from '../types.ts';

// Clean character set: 32 uppercase characters (excluding confusing 0/O, 1/I)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a deterministic 6-character uppercase code based on a seed string (e.g. product id).
 * Always returns the same 6-character code for the same input.
 */
export function generateDeterministicShortCode(seed: string): string {
  if (!seed) return 'STD001';
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);
  let code = '';
  for (let i = 0; i < 6; i++) {
    const charIndex = (hash + i * 13 + (seed.charCodeAt(i % seed.length) || 0) * 7) % CODE_CHARS.length;
    code += CODE_CHARS.charAt(Math.abs(charIndex));
  }
  return code.toUpperCase();
}

/**
 * Generates a fresh random 6-character unique product code (e.g. "K7X9PQ").
 */
export function generateNewShortCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code.toUpperCase();
}

/**
 * Returns the 6-character unique ID for any product.
 * If product.shortCode exists (length >= 4), it uses it; otherwise generates a deterministic 6-character code.
 */
export function getProductShortCode(product: Partial<Product> | null | undefined): string {
  if (!product) return 'STD000';
  if (product.shortCode && product.shortCode.trim().length >= 4) {
    return product.shortCode.trim().toUpperCase().slice(0, 8);
  }
  return generateDeterministicShortCode(product.id || product.sku || product.name || 'PROD01');
}

/**
 * Builds the canonical shareable URL with the 6-character product unique ID:
 * e.g. "https://domain.com/?p=K7X9PQ"
 */
export function getProductShareUrl(product: Partial<Product> | null | undefined): string {
  const code = getProductShortCode(product);
  if (typeof window === 'undefined') {
    return `/?p=${code}`;
  }
  const origin = window.location.origin;
  const pathname = window.location.pathname.replace(/\/$/, '');
  return `${origin}${pathname}/?p=${code}`;
}

/**
 * Copies the product share link directly to clipboard.
 */
export async function copyProductShareLink(product: Partial<Product> | null | undefined): Promise<string> {
  const url = getProductShareUrl(product);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } catch (err) {
    console.error('Failed to copy product link:', err);
  }
  return url;
}

/**
 * Builds a direct WhatsApp sharing link with product name, 6-character ID, and direct link.
 */
export function getWhatsAppShareUrl(product: Partial<Product>): string {
  const code = getProductShortCode(product);
  const url = getProductShareUrl(product);
  const name = product.name || 'Wholesale Apparel Lot';
  const text = `Check out this wholesale style: *${name}*\nProduct ID: *#${code}*\nDirect Link: ${url}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}
