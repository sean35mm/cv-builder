export const CUSTOM_DOMAIN_CHALLENGE_PREFIX = '_opencv-domain';
export const CUSTOM_DOMAIN_PROOF_PREFIX = 'opencv-domain-verification=';

export const customDomainChallengeName = (hostname: string): string =>
  `${CUSTOM_DOMAIN_CHALLENGE_PREFIX}.${hostname}`;

export const customDomainProofValue = (token: string): string =>
  `${CUSTOM_DOMAIN_PROOF_PREFIX}${token}`;

export const txtRecordsContainExactProof = (
  records: readonly (readonly string[])[],
  expected: string
): boolean => records.some((parts) => parts.join('') === expected);
