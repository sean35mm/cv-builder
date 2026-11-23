import { ConvexError } from 'convex/values';
import { OTP_RECIPIENT_BLOCKED } from '../lib/auth/otp-send-error';

// Carrier email-to-SMS gateways. Sign-in codes sent here become text messages,
// which is how the code form gets used to bomb phone numbers.
export const CARRIER_SMS_GATEWAY_DOMAINS: readonly string[] = [
  'email.uscc.net',
  'messaging.sprintpcs.com',
  'mms.att.net',
  'mms.cricketwireless.net',
  'msg.fi.google.com',
  'mymetropcs.com',
  'pm.sprint.com',
  'sms.myboostmobile.com',
  'tmomail.net',
  'txt.att.net',
  'vtext.com',
  'vzwpix.com',
];

const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

const splitEmail = (email: string): [string, string] => {
  const at = email.lastIndexOf('@');
  return [email.slice(0, at), email.slice(at + 1)];
};

/**
 * Key material for per-recipient OTP limits and challenge passes. Gmail ignores
 * dots and `+tag` suffixes and treats googlemail.com as gmail.com, so those
 * variants share one key. Never use this as the account identifier or the
 * delivery address. Expects an address already passed through normalizeEmail.
 */
export function canonicalOtpEmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const [local, domain] = splitEmail(lower);
  if (!GMAIL_DOMAINS.has(domain)) return lower;
  const base = local.split('+', 1)[0].replace(/\./g, '');
  return `${base || local}@gmail.com`;
}

export function isCarrierSmsGateway(email: string): boolean {
  const [, domain] = splitEmail(email.trim().toLowerCase());
  return CARRIER_SMS_GATEWAY_DOMAINS.some(
    (blocked) => domain === blocked || domain.endsWith(`.${blocked}`)
  );
}

export function assertOtpRecipientAllowed(email: string): void {
  if (isCarrierSmsGateway(email)) {
    throw new ConvexError({ kind: OTP_RECIPIENT_BLOCKED });
  }
}
