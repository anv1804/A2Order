export function generateIdempotencyKey(actionPrefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${actionPrefix}_${timestamp}_${randomStr}`;
}
