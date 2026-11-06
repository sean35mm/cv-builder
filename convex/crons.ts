import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'analytics retention',
  { hours: 24 },
  internal.analytics.deleteExpired,
  {}
);

export default crons;
