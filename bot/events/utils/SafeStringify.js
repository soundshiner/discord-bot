// ========================================
// bot/events/utils/SafeStringify.js
// - Version sécurisée de JSON.stringify, évite les erreurs circulaires
// ========================================

export function safeStringify (value, space = 2) {
  const seen = new WeakSet();

  return JSON.stringify(value, function (key, val) {
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
    }
    return val;
  }, space);
}
