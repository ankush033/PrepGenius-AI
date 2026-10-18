const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const serverRoot = path.resolve(__dirname, "..");

function loadAuthController(mocks) {
  const filename = path.join(serverRoot, "controllers/authController.js");
  delete require.cache[filename];
  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (parent?.filename === filename && Object.hasOwn(mocks, request)) return mocks[request];
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return require(filename);
  } finally {
    Module._load = originalLoad;
  }
}

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("login finds the user, verifies the password, and returns a signed token", async () => {
  const calls = [];
  const user = { _id: "user-1", name: "Test User", email: "test@example.com", password: "hashed" };
  const controller = loadAuthController({
    "../models/User": { findOne: async (query) => { calls.push(["findOne", query]); return user; } },
    bcrypt: { compare: async (...args) => { calls.push(["compare", ...args]); return true; } },
    jsonwebtoken: { sign: (...args) => { calls.push(["sign", ...args]); return "signed-token"; } },
  });
  const res = response();

  await controller.login({ body: { email: "test@example.com", password: "correct-password" } }, res);

  assert.deepEqual(calls[0], ["findOne", { email: "test@example.com" }]);
  assert.deepEqual(calls[1], ["compare", "correct-password", "hashed"]);
  assert.deepEqual(calls[2], ["sign", { id: "user-1" }, process.env.JWT_SECRET, { expiresIn: "7d" }]);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.token, "signed-token");
  assert.deepEqual(res.body.user, { id: "user-1", name: "Test User", email: "test@example.com" });
});

test("login rejects a password that does not match", async () => {
  let signed = false;
  const controller = loadAuthController({
    "../models/User": { findOne: async () => ({ password: "hashed" }) },
    bcrypt: { compare: async () => false },
    jsonwebtoken: { sign: () => { signed = true; return "unused"; } },
  });
  const res = response();

  await controller.login({ body: { email: "test@example.com", password: "wrong-password" } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Invalid Credentials");
  assert.equal(signed, false);
});

test("session verification returns only the authenticated user's public fields", async () => {
  let query;
  const controller = loadAuthController({
    "../models/User": { findById: (id) => { query = id; return { select: async (fields) => {
      assert.equal(fields, "name email");
      return { _id: "user-1", name: "Test User", email: "test@example.com" };
    } }; } },
  });
  const res = response();

  await controller.me({ user: { id: "user-1" } }, res);

  assert.equal(query, "user-1");
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    success: true,
    user: { id: "user-1", name: "Test User", email: "test@example.com" },
  });
});

test("session verification rejects a token whose user no longer exists", async () => {
  const controller = loadAuthController({
    "../models/User": { findById: () => ({ select: async () => null }) },
  });
  const res = response();

  await controller.me({ user: { id: "deleted-user" } }, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});
