import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'analytics retention',
  { hours: 24 },
  internal.analytics.deleteExpired,
  {}
);

crons.daily(
  'abandoned sign-in placeholder cleanup',
  { hourUTC: 9, minuteUTC: 17 },
  internal.placeholderCleanup.cleanupAbandonedPlaceholders,
  {}
);

export default crons;
