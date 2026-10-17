const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const serverRoot = path.resolve(__dirname, "..");

function loadWithMocks(relativePath, mocks) {
  const filename = path.join(serverRoot, relativePath);
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
    headersSent: false,
    chunks: [],
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    set() { return this; },
    flushHeaders() { this.headersSent = true; },
    write(chunk) { this.headersSent = true; this.chunks.push(chunk); return true; },
    end() { this.writableEnded = true; return this; },
  };
}

function silenceLogs(t) {
  for (const method of ["log", "info", "warn", "error"]) {
    t.mock.method(console, method, () => {});
  }
}

test("document list and delete handlers scope reads and vector deletion to the authenticated user", async (t) => {
  silenceLogs(t);
  const calls = [];
  const docs = [{ _id: "doc-user-a", user: "user-a" }];
  const Document = {
    find(filter) {
      calls.push(["find", filter]);
      return { sort: async () => docs.filter((doc) => doc.user === filter.user) };
    },
    findOne: async (filter) => {
      calls.push(["findOne", filter]);
      return docs.find((doc) => doc._id === filter._id && doc.user === filter.user) || null;
    },
  };
  let vectorDeletes = 0;
  const controller = loadWithMocks("controllers/documentController.js", {
    "../models/Document": Document,
    "../rag/pdfLoader": async () => [],
    "../rag/chunkText": async () => [],
    "../services/embeddingService": async () => [],
    "../services/documentInsightsService": async () => ({}),
    "../services/ocrService": async () => [],
    "../services/pineconeService": {
      storeChunks: async () => {},
      deleteDocumentVectors: async () => { vectorDeletes += 1; },
    },
    "fs/promises": { unlink: async () => {} },
  });

  const listResponse = response();
  await controller.getDocuments({ user: { id: "user-b" } }, listResponse);
  assert.deepEqual(listResponse.body.documents, []);
  assert.deepEqual(calls[0], ["find", { user: "user-b" }]);

  const deleteResponse = response();
  await controller.deleteDocument({ user: { id: "user-b" }, params: { id: "doc-user-a" } }, deleteResponse);
  assert.equal(deleteResponse.statusCode, 404);
  assert.deepEqual(calls[1], ["findOne", { _id: "doc-user-a", user: "user-b" }]);
  assert.equal(vectorDeletes, 0);
});

test("conversation reads do not expose another user's messages", async (t) => {
  silenceLogs(t);
  let messageReads = 0;
  const controller = loadWithMocks("controllers/chatController.js", {
    "../services/embeddingService": async () => [],
    "../services/pineconeService": { searchChunks: async () => [] },
    "../services/geminiService": async () => "answer",
    "../models/Conversation": { findOne: async (filter) => filter.user === "user-a" ? { _id: "conv-a" } : null },
    "../models/Message": { find: () => { messageReads += 1; return { sort: async () => [] }; } },
    "../models/Document": { find: () => ({ select: async () => [] }) },
  });
  const res = response();
  await controller.getConversation({ user: { id: "user-b" }, params: { conversationId: "conv-a" } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(messageReads, 0);
});

async function invokeUploadRequest(t, { loadPDF, ocr, storeChunks, deleteVectors, duplicate = false }) {
  silenceLogs(t);
  const removedPaths = [];
  const stored = {
    _id: { toString: () => "new-doc-id" },
    originalName: "test.pdf",
    summary: "summary",
    suggestedQuestions: [],
    processingStatus: "processing",
    save: async function () {},
  };
  const Document = {
    findOne: async () => duplicate ? { _id: "duplicate" } : null,
    create: async () => stored,
  };
  const controller = loadWithMocks("controllers/documentController.js", {
    "../models/Document": Document,
    "../rag/pdfLoader": loadPDF,
    "../rag/chunkText": async (pages) => pages.length ? [{ pageContent: pages[0].text, metadata: { page_number: pages[0].page_number } }] : [],
    "../services/embeddingService": async () => [0.1, 0.2],
    "../services/documentInsightsService": async () => ({ summary: "summary", suggestedQuestions: [] }),
    "../services/ocrService": ocr,
    "../services/pineconeService": { storeChunks, deleteDocumentVectors: deleteVectors },
    "fs/promises": { unlink: async (filePath) => { removedPaths.push(filePath); } },
  });
  const req = {
    user: { id: "user-a" },
    file: { path: "uploads/test-temporary.pdf", originalname: "test.pdf", filename: "test-temporary.pdf" },
  };
  const res = response();
  await controller.uploadDocument(req, res);
  return { res, removedPaths, stored };
}

test("scanned PDFs use OCR and successful uploads clean up the temporary file", async (t) => {
  let ocrCalls = 0;
  const { res, removedPaths } = await invokeUploadRequest(t, {
    loadPDF: async () => [{ page_number: 1, text: "scan" }],
    ocr: async () => { ocrCalls += 1; return [{ page_number: 1, text: "OCR readable content ".repeat(8) }]; },
    storeChunks: async () => {},
    deleteVectors: async () => {},
  });
  assert.equal(ocrCalls, 1);
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  assert.deepEqual(removedPaths, ["uploads/test-temporary.pdf"]);
});

test("malformed text extraction falls back to OCR; Pinecone upload failure marks failed, attempts cleanup, and removes the file", async (t) => {
  let ocrCalls = 0;
  let vectorCleanupCalls = 0;
  const { res, removedPaths, stored } = await invokeUploadRequest(t, {
    loadPDF: async () => { throw new Error("malformed PDF"); },
    ocr: async () => { ocrCalls += 1; return [{ page_number: 1, text: "OCR readable content ".repeat(8) }]; },
    storeChunks: async () => { throw new Error("upsert failed"); },
    deleteVectors: async () => { vectorCleanupCalls += 1; },
  });
  assert.equal(ocrCalls, 1);
  assert.equal(res.statusCode, 500);
  assert.equal(stored.processingStatus, "failed");
  assert.equal(vectorCleanupCalls, 1);
  assert.deepEqual(removedPaths, ["uploads/test-temporary.pdf"]);
});

test("duplicate-upload rejection still removes the temporary file", async (t) => {
  const { res, removedPaths } = await invokeUploadRequest(t, {
    loadPDF: async () => [], ocr: async () => [], storeChunks: async () => {}, deleteVectors: async () => {}, duplicate: true,
  });
  assert.equal(res.statusCode, 400);
  assert.deepEqual(removedPaths, ["uploads/test-temporary.pdf"]);
});

test("Pinecone deletion failure leaves the document non-retrievable for safe retry", async (t) => {
  silenceLogs(t);
  let deleteCalls = 0;
  const document = { _id: "doc-a", user: "user-a", processingStatus: "ready", save: async function () {} };
  const Document = {
    findOne: async (filter) => filter.user === "user-a" ? document : null,
    deleteOne: async () => ({ deletedCount: 1 }),
  };
  const controller = loadWithMocks("controllers/documentController.js", {
    "../models/Document": Document,
    "../rag/pdfLoader": async () => [],
    "../rag/chunkText": async () => [],
    "../services/embeddingService": async () => [],
    "../services/documentInsightsService": async () => ({}),
    "../services/ocrService": async () => [],
    "../services/pineconeService": {
      storeChunks: async () => {},
      deleteDocumentVectors: async () => { deleteCalls += 1; throw new Error("delete timed out"); },
    },
    "fs/promises": { unlink: async () => {} },
  });
  const res = response();
  await controller.deleteDocument({ user: { id: "user-a" }, params: { id: "doc-a" } }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(deleteCalls, 1);
  assert.equal(document.processingStatus, "failed");
  assert.match(document.processingError, /retry/i);
});

test("MongoDB deletion failure after vector cleanup preserves a failed document record", async (t) => {
  silenceLogs(t);
  let vectorDeleteCalls = 0;
  const document = {
    _id: "doc-a", user: "user-a", processingStatus: "ready", vectorCount: 3,
    save: async function () {},
  };
  const Document = {
    findOne: async () => document,
    deleteOne: async () => { throw new Error("database unavailable"); },
  };
  const controller = loadWithMocks("controllers/documentController.js", {
    "../models/Document": Document,
    "../rag/pdfLoader": async () => [],
    "../rag/chunkText": async () => [],
    "../services/embeddingService": async () => [],
    "../services/documentInsightsService": async () => ({}),
    "../services/ocrService": async () => [],
    "../services/pineconeService": {
      storeChunks: async () => {},
      deleteDocumentVectors: async () => { vectorDeleteCalls += 1; },
    },
    "fs/promises": { unlink: async () => {} },
  });
  const res = response();
  await controller.deleteDocument({ user: { id: "user-a" }, params: { id: "doc-a" } }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(vectorDeleteCalls, 1);
  assert.equal(document.processingStatus, "failed");
  assert.equal(document.vectorCount, 0);
});

test("legacy documents without processingStatus are included in retrieval eligibility", async (t) => {
  silenceLogs(t);
  let eligibilityQuery;
  let messages = [];
  const legacyDocId = "legacy-doc";
  const controller = loadWithMocks("controllers/chatController.js", {
    "../services/embeddingService": async () => [0.1],
    "../services/pineconeService": { searchChunks: async () => [{ score: 0.9, metadata: { documentId: legacyDocId, fileName: "legacy.pdf", page_number: 2, text: "legacy content" } }] },
    "../services/geminiService": async (question, context, history, options) => { options.onToken("answer"); return "answer"; },
    "../models/Conversation": { findOne: async () => ({ _id: "conv-a", title: "Chat", save: async () => {} }) },
    "../models/Message": {
      find: () => ({ sort() { return this; }, limit: async () => [] }),
      create: async (message) => { message.save = async () => {}; messages.push(message); return message; },
    },
    "../models/Document": { find: (query) => { eligibilityQuery = query; return { select: async () => [{ _id: { toString: () => legacyDocId } }] }; } },
  });
  const res = response();
  await controller.sendMessage({ user: { id: "user-a" }, params: { conversationId: "conv-a" }, body: { question: "question" } }, res);
  assert.deepEqual(eligibilityQuery.$or, [
    { processingStatus: "ready" },
    { processingStatus: { $exists: false } },
  ]);
  assert.equal(messages[1].sources[0].page, 2);
  assert.ok(res.chunks.some((chunk) => chunk.includes('"type":"done"')));
});

test("embedding failure after saving a user message marks the turn failed", async (t) => {
  silenceLogs(t);
  const savedMessages = [];
  const controller = loadWithMocks("controllers/chatController.js", {
    "../services/embeddingService": async () => { throw new Error("provider unavailable"); },
    "../services/pineconeService": { searchChunks: async () => [] },
    "../services/geminiService": async () => "answer",
    "../models/Conversation": { findOne: async () => ({ _id: "conv-a", title: "Chat", save: async () => {} }) },
    "../models/Message": {
      find: () => ({ sort() { return this; }, limit: async () => [] }),
      create: async (message) => { message.save = async () => {}; savedMessages.push(message); return message; },
    },
    "../models/Document": { find: () => ({ select: async () => [] }) },
  });
  const res = response();
  await controller.sendMessage({ user: { id: "user-a" }, params: { conversationId: "conv-a" }, body: { question: "question" } }, res);
  assert.equal(res.statusCode, 500);
  assert.equal(savedMessages.length, 1);
  assert.equal(savedMessages[0].role, "user");
  assert.equal(savedMessages[0].turnStatus, "failed");
});

test("Pinecone search and deletion use only the authenticated user's namespace", async () => {
  const namespaces = [];
  const index = {
    namespace(userId) {
      namespaces.push(userId);
      return {
        query: async () => ({ matches: [] }),
        deleteMany: async () => {},
      };
    },
  };
  const pinecone = loadWithMocks("services/pineconeService.js", { "../config/pinecone": index });
  await pinecone.searchChunks([0.1], "user-b");
  await pinecone.deleteDocumentVectors("user-b", "doc-b");
  assert.deepEqual(namespaces, ["user-b", "user-b"]);
});
