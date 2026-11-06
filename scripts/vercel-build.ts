import { spawnSync } from 'node:child_process';

type Environment = Record<string, string | undefined>;

export function validateProductionBuildEnvironment(env: Environment): void {
  for (const name of [
    'CONVEX_DEPLOY_KEY',
    'CONVEX_SITE_URL',
    'NEXT_PUBLIC_CONVEX_URL',
    'NEXT_PUBLIC_SITE_URL',
    'PROFILE_ACCESS_SERVICE_SECRET',
    'PROFILE_PASSCODE_PEPPER',
  ]) {
    if (!env[name]?.trim())
      throw new Error(`Missing production setting: ${name}`);
  }
  for (const name of [
    'PROFILE_ACCESS_SERVICE_SECRET',
    'PROFILE_PASSCODE_PEPPER',
  ]) {
    if (env[name]!.length < 32)
      throw new Error(
        `Production setting ${name} must be at least 32 characters`
      );
  }
  const origin = (name: string) => {
    let url: URL;
    try {
      url = new URL(env[name]!);
    } catch {
      throw new Error(`Invalid production URL: ${name}`);
    }
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.port
    ) {
      throw new Error(`Production setting ${name} must be an HTTPS origin`);
    }
    return url;
  };
  const backend = origin('NEXT_PUBLIC_CONVEX_URL');
  const site = origin('CONVEX_SITE_URL');
  origin('NEXT_PUBLIC_SITE_URL');
  if (
    !/^[a-z0-9-]+\.convex\.cloud$/.test(backend.hostname) ||
    site.hostname !== backend.hostname.replace(/\.cloud$/, '.site')
  ) {
    throw new Error(
      'NEXT_PUBLIC_CONVEX_URL and CONVEX_SITE_URL must identify the same Convex cloud deployment'
    );
  }
}

export function vercelBuildCommand(env: Environment): string[] {
  if (env.VERCEL_ENV !== 'production') return ['bun', 'run', 'build'];
  validateProductionBuildEnvironment(env);
  return [
    'bunx',
    '--no-install',
    'convex',
    'deploy',
    '--cmd-url-env-var-name',
    'NEXT_PUBLIC_CONVEX_URL',
    // Convex injects the deploy key's actual URL before this command and only
    // pushes backend code after it succeeds. Reject a key/site mismatch here.
    '--cmd',
    'bun scripts/vercel-build.ts --validate && bun run build',
  ];
}

if (import.meta.main) {
  try {
    if (process.argv.includes('--validate')) {
      validateProductionBuildEnvironment(process.env);
    } else {
      const [command, ...args] = vercelBuildCommand(process.env);
      const result = spawnSync(command, args, { stdio: 'inherit' });
      process.exit(result.status ?? 1);
    }
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : 'Production build validation failed'
    );
    process.exit(1);
  }
}
