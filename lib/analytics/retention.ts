export const ANALYTICS_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
export const ANALYTICS_RETENTION_DELETE_BATCH_SIZE = 500;

export const analyticsRetentionCutoff = (now: number): number =>
  now - ANALYTICS_RETENTION_MS;

export const analyticsEventIsExpired = (
  createdAt: number,
  now: number
): boolean => createdAt < analyticsRetentionCutoff(now);

export const analyticsRetentionDrainPolicy = (
  deletedCount: number
): { rescheduleImmediately: boolean } => {
  if (
    !Number.isInteger(deletedCount) ||
    deletedCount < 0 ||
    deletedCount > ANALYTICS_RETENTION_DELETE_BATCH_SIZE
  ) {
    throw new Error('Analytics retention deletion count is invalid');
  }
  return {
    rescheduleImmediately:
      deletedCount === ANALYTICS_RETENTION_DELETE_BATCH_SIZE,
  };
};
