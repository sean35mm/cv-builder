export type VercelDomainState = {
  exists: boolean;
  verified: boolean;
  configured: boolean;
};

export type VercelAdapterConfig = {
  token: string;
  projectId: string;
  teamId?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export class VercelProviderError extends Error {
  constructor(
    public readonly code: 'PROVIDER_TIMEOUT' | 'PROVIDER_UNAVAILABLE' | 'PROVIDER_RESPONSE_INVALID',
    public readonly ambiguous: boolean
  ) {
    super(code);
  }
}

const MAX_RESPONSE_BYTES = 32 * 1024;

const configuration = (config: VercelAdapterConfig) => {
  if (
    !config.token ||
    !config.projectId ||
    config.token.length > 4096 ||
    config.projectId.length > 256 ||
    (config.teamId?.length ?? 0) > 256
  ) {
    throw new Error('CUSTOM_DOMAINS_NOT_CONFIGURED');
  }
  return {
    fetchImpl: config.fetchImpl ?? fetch,
    timeoutMs: config.timeoutMs ?? 8_000,
  };
};

const endpoint = (
  config: VercelAdapterConfig,
  version: 'v9' | 'v10',
  hostname?: string
) => {
  const base = `https://api.vercel.com/${version}/projects/${encodeURIComponent(config.projectId)}/domains`;
  const url = new URL(hostname ? `${base}/${encodeURIComponent(hostname)}` : base);
  if (config.teamId) url.searchParams.set('teamId', config.teamId);
  return url.toString();
};

const readBoundedJson = async (response: Response): Promise<Record<string, unknown> | null> => {
  const declaredLength = Number(response.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_RESPONSE_BYTES) return null;
  if (!response.body) return null;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  if (text.length > MAX_RESPONSE_BYTES) return null;
  try {
    const value: unknown = text ? JSON.parse(text) : {};
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const providerRequest = async (
  config: VercelAdapterConfig,
  url: string,
  init: RequestInit
): Promise<Response> => {
  const { fetchImpl, timeoutMs } = configuration(config);
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    return await fetchImpl(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.token}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      redirect: 'error',
      cache: 'no-store',
      signal,
    });
  } catch {
    throw new VercelProviderError(
      signal.aborted ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
      true
    );
  }
};

export async function getVercelDomain(
  config: VercelAdapterConfig,
  hostname: string
): Promise<VercelDomainState> {
  const response = await providerRequest(config, endpoint(config, 'v9', hostname), {
    method: 'GET',
  });
  if (response.status === 404) return { exists: false, verified: false, configured: false };
  if (response.status >= 500) throw new VercelProviderError('PROVIDER_UNAVAILABLE', true);
  if (!response.ok) throw new VercelProviderError('PROVIDER_UNAVAILABLE', false);
  const body = await readBoundedJson(response);
  if (
    !body ||
    body.name !== hostname ||
    typeof body.verified !== 'boolean' ||
    typeof body.misconfigured !== 'boolean'
  ) {
    throw new VercelProviderError('PROVIDER_RESPONSE_INVALID', true);
  }
  return {
    exists: true,
    verified: body.verified,
    configured: !body.misconfigured,
  };
}

export async function addVercelDomain(
  config: VercelAdapterConfig,
  hostname: string
): Promise<VercelDomainState> {
  const response = await providerRequest(config, endpoint(config, 'v10'), {
    method: 'POST',
    body: JSON.stringify({ name: hostname }),
  });
  if (response.ok || response.status === 409) return getVercelDomain(config, hostname);
  if (response.status >= 500) return getVercelDomain(config, hostname);
  throw new VercelProviderError('PROVIDER_UNAVAILABLE', false);
}

export async function removeVercelDomain(
  config: VercelAdapterConfig,
  hostname: string
): Promise<boolean> {
  const response = await providerRequest(config, endpoint(config, 'v9', hostname), {
    method: 'DELETE',
  });
  if (response.status === 404) return true;
  if (response.status >= 500) {
    return !(await getVercelDomain(config, hostname)).exists;
  }
  if (!response.ok) throw new VercelProviderError('PROVIDER_UNAVAILABLE', false);
  return !(await getVercelDomain(config, hostname)).exists;
}
