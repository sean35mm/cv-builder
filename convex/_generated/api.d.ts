/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ResendOTP from "../ResendOTP.js";
import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as analyticsDigest from "../analyticsDigest.js";
import type * as auth from "../auth.js";
import type * as authCleanup from "../authCleanup.js";
import type * as authLinking from "../authLinking.js";
import type * as crons from "../crons.js";
import type * as customDomains from "../customDomains.js";
import type * as customDomainsNode from "../customDomainsNode.js";
import type * as deletion from "../deletion.js";
import type * as directory from "../directory.js";
import type * as directoryProjection from "../directoryProjection.js";
import type * as embed from "../embed.js";
import type * as exports from "../exports.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as operationalHealth from "../operationalHealth.js";
import type * as operationalHealthClassification from "../operationalHealthClassification.js";
import type * as pdf from "../pdf.js";
import type * as phase5Settings from "../phase5Settings.js";
import type * as profileAccess from "../profileAccess.js";
import type * as profileAccessHttp from "../profileAccessHttp.js";
import type * as profileLocales from "../profileLocales.js";
import type * as profilePasscodeCrypto from "../profilePasscodeCrypto.js";
import type * as profileValidators from "../profileValidators.js";
import type * as profileValueValidators from "../profileValueValidators.js";
import type * as profiles from "../profiles.js";
import type * as publicProfiles from "../publicProfiles.js";
import type * as rateLimitKey from "../rateLimitKey.js";
import type * as rateLimits from "../rateLimits.js";
import type * as storage from "../storage.js";
import type * as testimonialExpiry from "../testimonialExpiry.js";
import type * as testimonials from "../testimonials.js";
import type * as usernameCollisions from "../usernameCollisions.js";
import type * as usernameMaintenance from "../usernameMaintenance.js";
import type * as validation from "../validation.js";
import type * as versions from "../versions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  ai: typeof ai;
  analytics: typeof analytics;
  analyticsDigest: typeof analyticsDigest;
  auth: typeof auth;
  authCleanup: typeof authCleanup;
  authLinking: typeof authLinking;
  crons: typeof crons;
  customDomains: typeof customDomains;
  customDomainsNode: typeof customDomainsNode;
  deletion: typeof deletion;
  directory: typeof directory;
  directoryProjection: typeof directoryProjection;
  embed: typeof embed;
  exports: typeof exports;
  http: typeof http;
  messages: typeof messages;
  migrations: typeof migrations;
  operationalHealth: typeof operationalHealth;
  operationalHealthClassification: typeof operationalHealthClassification;
  pdf: typeof pdf;
  phase5Settings: typeof phase5Settings;
  profileAccess: typeof profileAccess;
  profileAccessHttp: typeof profileAccessHttp;
  profileLocales: typeof profileLocales;
  profilePasscodeCrypto: typeof profilePasscodeCrypto;
  profileValidators: typeof profileValidators;
  profileValueValidators: typeof profileValueValidators;
  profiles: typeof profiles;
  publicProfiles: typeof publicProfiles;
  rateLimitKey: typeof rateLimitKey;
  rateLimits: typeof rateLimits;
  storage: typeof storage;
  testimonialExpiry: typeof testimonialExpiry;
  testimonials: typeof testimonials;
  usernameCollisions: typeof usernameCollisions;
  usernameMaintenance: typeof usernameMaintenance;
  validation: typeof validation;
  versions: typeof versions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
