import { isIP } from 'node:net';

const HTTP_HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

export type TrustedIpHeaderConfig = {
  vercel?: string;
  cfPages?: string;
  flyAppName?: string;
  trustedIpHeader?: string;
};

function configuredTrustedIpHeader(value?: string): string | undefined {
  const header = value?.trim().toLowerCase();
  if (!header) return undefined;
  if (header.length > 128 || !HTTP_HEADER_NAME_PATTERN.test(header)) {
    throw new Error('PDF_TRUSTED_IP_HEADER must be a valid HTTP header name');
  }
  return header;
}

export function trustedCallerAddress(
  headers: Headers,
  config: TrustedIpHeaderConfig
): string | undefined {
  const header =
    config.vercel === '1'
      ? 'x-vercel-forwarded-for'
      : config.cfPages === '1'
        ? 'cf-connecting-ip'
        : config.flyAppName
          ? 'fly-client-ip'
          : configuredTrustedIpHeader(config.trustedIpHeader);
  const address = header
    ? headers.get(header)?.split(',')[0]?.trim()
    : undefined;
  return address && address.length <= 45 && isIP(address) ? address : undefined;
}
