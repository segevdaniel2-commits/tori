const TTL_MS = 30 * 60 * 1000; // 30 minutes

const store = new Map();

function set(key, value) {
  const existing = store.get(key);
  if (existing) clearTimeout(existing.timer);
  const timer = setTimeout(() => store.delete(key), TTL_MS);
  store.set(key, { value, timer, expiresAt: Date.now() + TTL_MS });
}

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  return entry.value;
}

function del(key) {
  const entry = store.get(key);
  if (entry) {
    clearTimeout(entry.timer);
    store.delete(key);
  }
}

function size() {
  return store.size;
}

module.exports = { set, get, del, size };
