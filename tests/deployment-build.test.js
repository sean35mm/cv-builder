import { describe, expect, test } from 'bun:test';
import {
  validateProductionBuildEnvironment,
  vercelBuildCommand,
} from '../scripts/vercel-build';

const settings = {
  VERCEL_ENV: 'production',
  CONVEX_DEPLOY_KEY: 'test-only-not-a-real-key',
  CONVEX_SITE_URL: 'https://test-deployment.convex.site',
  NEXT_PUBLIC_CONVEX_URL: 'https://test-deployment.convex.cloud',
  NEXT_PUBLIC_SITE_URL: 'https://example.invalid',
  PROFILE_ACCESS_SERVICE_SECRET: 's'.repeat(32),
  PROFILE_PASSCODE_PEPPER: 'p'.repeat(32),
};

describe('production build admission without deployment', () => {
  test('previews never deploy, even when a key is present', () => {
    expect(vercelBuildCommand({ ...settings, VERCEL_ENV: 'preview' })).toEqual([
      'bun',
      'run',
      'build',
    ]);
    expect(vercelBuildCommand({})).toEqual(['bun', 'run', 'build']);
  });
  test.each(Object.keys(settings).filter((key) => key !== 'VERCEL_ENV'))(
    'rejects missing %s',
    (key) => {
      expect(() => vercelBuildCommand({ ...settings, [key]: '' })).toThrow(key);
    }
  );
  test('uses deploy-key-selected URL and revalidates before the backend push', () => {
    const command = vercelBuildCommand(settings);
    expect(command).toContain('deploy');
    expect(command.slice(-4)).toEqual([
      '--cmd-url-env-var-name',
      'NEXT_PUBLIC_CONVEX_URL',
      '--cmd',
      'bun scripts/vercel-build.ts --validate && bun run build',
    ]);
    expect(() =>
      validateProductionBuildEnvironment({
        ...settings,
        NEXT_PUBLIC_CONVEX_URL: 'https://wrong-deployment.convex.cloud',
      })
    ).toThrow('same Convex');
  });
  test.each([
    'http://example.invalid',
    'https://example.invalid/path',
    'https://user:secret@example.invalid',
  ])('rejects unsafe site origin %s without echoing it', (value) => {
    expect(() =>
      validateProductionBuildEnvironment({
        ...settings,
        NEXT_PUBLIC_SITE_URL: value,
      })
    ).toThrow('NEXT_PUBLIC_SITE_URL');
    try {
      validateProductionBuildEnvironment({
        ...settings,
        NEXT_PUBLIC_SITE_URL: value,
      });
    } catch (error) {
      expect(error.message).not.toContain(value);
    }
  });
  test.each(['PROFILE_ACCESS_SERVICE_SECRET', 'PROFILE_PASSCODE_PEPPER'])(
    'rejects undersized %s',
    (key) => {
      expect(() =>
        validateProductionBuildEnvironment({ ...settings, [key]: 'short' })
      ).toThrow(key);
    }
  );
});
