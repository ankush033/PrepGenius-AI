const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const routeFile = path.resolve(__dirname, "../routes/chatRoutes.js");
function loadRoutes() {
  delete require.cache[routeFile];
  const originalLoad = Module._load;
  const controller = Object.fromEntries([
    "createConversation", "getConversations", "getConversation", "sendMessage", "deleteConversation", "renameConversation",
  ].map((name) => [name, (_req, res) => res.status(201).json({ success: true })]));
  Module._load = function (request, parent, isMain) {
    if (parent?.filename === routeFile && request === "../middleware/authMiddleware") {
      return (_req, _res, next) => next();
    }
    if (parent?.filename === routeFile && request === "../controllers/chatController") return controller;
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return require(routeFile);
  } finally {
    Module._load = originalLoad;
  }
}

function findRoute(router, method, routePath) {
  return router.stack.find((layer) => layer.route?.path === routePath && layer.route.methods[method]).route;
}

function response() {
  return {
    statusCode: 200,
    set() { return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function invoke(route, req) {
  const res = response();
  const handlers = route.stack.map((layer) => layer.handle);
  let position = 0;
  const next = async (error) => {
    if (error) throw error;
    const handler = handlers[position++];
    if (handler) await handler(req, res, next);
  };
  await next();
  return res;
}

test("conversation creation and other mutating chat routes have rate limits", async () => {
  const router = loadRoutes();
  for (const [method, routePath, max] of [
    ["post", "/new", 30],
    ["post", "/:conversationId", 60],
    ["patch", "/:conversationId", 30],
    ["delete", "/:conversationId", 30],
  ]) {
    const route = findRoute(router, method, routePath);
    const req = { ip: `mutation-test-${method}`, user: { id: "user-rate-limit" }, params: { conversationId: "c1" }, body: { title: "name" } };
    let last;
    for (let i = 0; i <= max; i += 1) last = await invoke(route, req);
    assert.equal(last.statusCode, 429, `${method.toUpperCase()} ${routePath} should be limited`);
  }
});
