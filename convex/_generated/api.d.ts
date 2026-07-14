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
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as authCleanup from "../authCleanup.js";
import type * as authLinking from "../authLinking.js";
import type * as crons from "../crons.js";
import type * as deletion from "../deletion.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as pdf from "../pdf.js";
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
import type * as validation from "../validation.js";
import type * as versions from "../versions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  analytics: typeof analytics;
  auth: typeof auth;
  authCleanup: typeof authCleanup;
  authLinking: typeof authLinking;
  crons: typeof crons;
  deletion: typeof deletion;
  http: typeof http;
  messages: typeof messages;
  migrations: typeof migrations;
  pdf: typeof pdf;
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
