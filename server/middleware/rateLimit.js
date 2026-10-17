const buckets = new Map();

function rateLimit({ windowMs, max, key = (req) => req.ip }) {
  return (req, res, next) => {
    const now = Date.now();
    const bucketKey = key(req);
    let bucket = buckets.get(bucketKey);
    if (!bucket && buckets.size >= 20000) {
      for (const [expiredKey, value] of buckets) if (value.resetAt <= now) buckets.delete(expiredKey);
      if (buckets.size >= 20000) {
        return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
      }
    }
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(bucketKey, bucket);
    }
    bucket.count += 1;
    if (buckets.size > 10000) {
      for (const [key, value] of buckets) if (value.resetAt <= now) buckets.delete(key);
    }
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    if (bucket.count > max) {
      res.set("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
    }
    return next();
  };
}

module.exports = rateLimit;
