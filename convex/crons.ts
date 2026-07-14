import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.hourly(
  'resume stalled account deletions',
  { minuteUTC: 17 },
  internal.deletion.resumeStalledDeletionJobs
);

export default crons;
