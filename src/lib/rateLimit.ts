interface Bucket {
  count:   number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Fenêtre glissante simple en mémoire — suffisant pour une instance unique.
// Si l'app tourne un jour sur plusieurs instances, remplacer par un store partagé (Redis).
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}
