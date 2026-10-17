const index = require("../config/pinecone");

// ==========================
// Store Chunks
// ==========================
const storeChunks = async (
  chunks,
  embeddings,
  userId,
  documentId,
  fileName
) => {

  const vectors = chunks.map((chunk, i) => ({
    id: `${documentId}-${i}`,
    values: embeddings[i],
    metadata: {
      text: chunk.pageContent,
      userId,
      documentId,
      fileName,
      page_number:
        chunk.metadata?.page_number ??
        chunk.metadata?.loc?.pageNumber ??
        chunk.metadata?.page ??
        1,
      // Keep `page` for vectors uploaded before page_number was introduced.
      page:
        chunk.metadata?.page_number ??
        chunk.metadata?.loc?.pageNumber ??
        chunk.metadata?.page ??
        1,

      chunkIndex: i,
      totalChunks: chunks.length,
    },
  }));

  try {
    await index.namespace(userId).upsert(vectors);
  } catch (err) {
    throw err;
  }

  return true;
};

// ==========================
// Search Chunks
// ==========================
const searchChunks = async (embedding, userId) => {

  const result = await index.namespace(userId).query({

    vector: embedding,

    topK: 10,

    includeMetadata: true,

  });

  return result.matches;

};

// ==========================
// Delete Document Vectors
// ==========================
const deleteDocumentVectors = async (userId, documentId) => {

  await index.namespace(userId).deleteMany({

    documentId,

  });

};

module.exports = {

  storeChunks,

  searchChunks,

  deleteDocumentVectors,

};
