const test = require("node:test");
const assert = require("node:assert/strict");
const rateLimit = require("../middleware/rateLimit");

function response() {
  return {
    headers: {},
    statusCode: 200,
    set(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("rate limit rejects requests after the configured maximum", () => {
  const limit = rateLimit({ windowMs: 60_000, max: 1, key: () => "test-rate-limit" });
  let nextCalls = 0;
  const req = { ip: "127.0.0.1" };
  const first = response();
  limit(req, first, () => { nextCalls += 1; });
  const second = response();
  limit(req, second, () => { nextCalls += 1; });

  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 429);
  assert.equal(nextCalls, 1);
  assert.equal(second.body.success, false);
  assert.ok(Number(second.headers["Retry-After"]) > 0);
});
