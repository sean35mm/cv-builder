export const featureEnabled = (value: string | undefined): boolean =>
  value === 'true';

export const aiWritingConfigured = (environment = process.env): boolean =>
  featureEnabled(environment.AI_WRITING_ENABLED) &&
  Boolean(environment.OPENAI_API_KEY?.trim()) &&
  Boolean(environment.OPENAI_MODEL?.trim());

export const analyticsDigestConfigured = (
  environment = process.env
): boolean =>
  featureEnabled(environment.ANALYTICS_DIGEST_ENABLED) &&
  Boolean(environment.AUTH_RESEND_KEY?.trim()) &&
  Boolean(environment.AUTH_EMAIL?.trim());
