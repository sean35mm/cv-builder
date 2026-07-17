import { describe, expect, test } from 'bun:test';
import {
  getProfileAccessFlags,
  getProfileRobotsPolicy,
  getProfileCapabilities,
  isProfileGrantValid,
  isProfileDirectoryDiscoverable,
  isProfileIndexable,
  isProfilePubliclyAccessible,
  resolveProfileAccessMode,
} from '../lib/profile/access';

describe('profile access policy', () => {
  test('round-trips each access mode through persisted boolean flags', () => {
    for (const mode of ['private', 'unlisted', 'public']) {
      const flags = getProfileAccessFlags(mode);
      expect(
        resolveProfileAccessMode(flags.isPublic, flags.isDirectoryListed)
      ).toBe(mode);
    }
    expect(getProfileAccessFlags('passcode')).toEqual({
      isPublic: false,
      isDirectoryListed: false,
    });
    expect(resolveProfileAccessMode(false, false, 'passcode')).toBe('passcode');
  });

  test('treats public profiles without an explicit directory flag as unlisted', () => {
    expect(resolveProfileAccessMode(true, undefined)).toBe('unlisted');
    expect(resolveProfileAccessMode(true, false)).toBe('unlisted');
    expect(resolveProfileAccessMode(false, true)).toBe('private');
  });

  test('keeps discoverability and indexing exclusive to public profiles', () => {
    expect(isProfilePubliclyAccessible('private')).toBe(false);
    expect(isProfilePubliclyAccessible('passcode')).toBe(false);
    expect(isProfilePubliclyAccessible('unlisted')).toBe(true);
    expect(isProfileDirectoryDiscoverable('unlisted')).toBe(false);
    expect(isProfileDirectoryDiscoverable('public')).toBe(true);
    expect(isProfileIndexable('unlisted')).toBe(false);
    expect(isProfileIndexable('public')).toBe(true);
  });

  test('emits noindex, nofollow, and noarchive for unlisted profiles', () => {
    expect(getProfileRobotsPolicy('unlisted')).toEqual({
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    });
    expect(getProfileRobotsPolicy('public')).toEqual({
      index: true,
      follow: true,
    });
  });

  test('requires a grant or owner authorization for passcode capabilities', () => {
    expect(getProfileCapabilities('passcode', 'none').view).toBe(false);
    expect(getProfileCapabilities('passcode', 'grant')).toMatchObject({
      view: true,
      contact: true,
      pdf: true,
      images: true,
      analytics: true,
      directory: false,
      index: false,
    });
    expect(getProfileCapabilities('private', 'grant').view).toBe(false);
    expect(getProfileCapabilities('private', 'owner').view).toBe(true);
  });

  test('invalidates grants on version, expiry, mode, deletion, or presentation changes', () => {
    const valid = {
      grantProfileId: 'profile',
      profileId: 'profile',
      grantAccessVersion: 3,
      profileAccessVersion: 3,
      expiresAt: 101,
      now: 100,
      mode: 'passcode',
    };
    expect(isProfileGrantValid(valid)).toBe(true);
    expect(isProfileGrantValid({ ...valid, profileAccessVersion: 4 })).toBe(false);
    expect(isProfileGrantValid({ ...valid, now: 101 })).toBe(false);
    expect(isProfileGrantValid({ ...valid, mode: 'public' })).toBe(false);
    expect(isProfileGrantValid({ ...valid, deleting: true })).toBe(false);
    expect(isProfileGrantValid({ ...valid, hasPresentation: false })).toBe(false);
  });
});
