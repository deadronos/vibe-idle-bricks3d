/**
 * Safely executes a method on an object if it exists and is a function.
 * This helper provides type safety by inferring argument and return types
 * from the target type definition.
 *
 * @param {T} target - The object on which to call the method.
 * @param {K} methodName - The name of the method to call.
 * @param {Parameters<T[K]>} args - The arguments to pass to the method.
 * @param {ReturnType<T[K]>} [fallback] - The value to return if execution fails or method doesn't exist.
 * @returns {ReturnType<T[K]> | undefined} The result of the method call or the fallback.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeExecute<T extends Record<string, any>, K extends keyof T>(
  target: T | null | undefined,
  methodName: K,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: T[K] extends (...args: any[]) => any ? Parameters<T[K]> : never[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fallback?: T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): (T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : undefined) | undefined {
  if (!target) return fallback;
  const fn = target[methodName];
  if (typeof fn !== 'function') return fallback;
  try {
    return fn.apply(target, args);
  } catch (err) {
    console.warn(`[SafeExecute] Error executing ${String(methodName)}:`, err);
    return fallback;
  }
}

/**
 * Safely executes a method that returns void on an object if it exists.
 *
 * @param {T} target - The object on which to call the method.
 * @param {K} methodName - The name of the method to call.
 * @param {Parameters<T[K]>} args - The arguments to pass to the method.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeVoidExecute<T extends Record<string, any>, K extends keyof T>(
  target: T | null | undefined,
  methodName: K,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: T[K] extends (...args: any[]) => any ? Parameters<T[K]> : never[]
): void {
  if (!target) return;
  const fn = target[methodName];
  if (typeof fn !== 'function') return;
  try {
    fn.apply(target, args);
  } catch (err) {
    console.warn(`[SafeExecute] Error executing ${String(methodName)}:`, err);
  }
}
