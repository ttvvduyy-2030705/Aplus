/*
 * Keep production builds smooth by removing leftover debug logging overhead.
 * Business logic is untouched; only console output is silenced outside dev.
 */
const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

if (!isDev && typeof console !== 'undefined') {
  const noop = () => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.warn = noop;
}
