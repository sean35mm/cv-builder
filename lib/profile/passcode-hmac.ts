import { createHmac } from 'node:crypto';
import { normalizeProfilePasscode } from './passcode-policy';

export const hmacProfilePasscode = (
  passcode: unknown,
  pepper: string
): string => {
  if (pepper.length < 32) throw new Error('Passcode pepper is invalid');
  return createHmac('sha256', pepper)
    .update(normalizeProfilePasscode(passcode), 'utf8')
    .digest('hex');
};
