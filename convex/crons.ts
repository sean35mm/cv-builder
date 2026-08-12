import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.hourly(
  'resume stalled account deletions',
  { minuteUTC: 17 },
  internal.deletion.resumeStalledDeletionJobs
);

crons.weekly(
  'send analytics digest',
  { dayOfWeek: 'monday', hourUTC: 14, minuteUTC: 7 },
  internal.analyticsDigest.sendWeekly
);

crons.hourly(
  'cleanup expired upload reservations',
  { minuteUTC: 41 },
  internal.storage.cleanupExpiredUploadSessions
);

crons.hourly(
  'cleanup expired profile access grants',
  { minuteUTC: 53 },
  internal.profileAccess.cleanupExpiredGrants
);

crons.interval(
  'reconcile custom domains',
  { minutes: 5 },
  internal.customDomainsNode.reconcileDue
);

export default crons;
