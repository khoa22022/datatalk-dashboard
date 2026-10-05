export const TRIAL_TRACKING_KEY = 'dt_trial_internal_sandbox';

export function firstRow(result) {
  if (result?.error) throw result.error;
  if (Array.isArray(result?.data)) return result.data[0] || null;
  return result?.data || null;
}

export function requireFirstRow(result, context = 'Database query') {
  const row = firstRow(result);
  if (!row) {
    const error = new Error(`${context} returned no row`);
    error.statusCode = 500;
    throw error;
  }
  return row;
}
