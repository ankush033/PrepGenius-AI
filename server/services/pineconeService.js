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

      page:
        chunk.metadata?.loc?.pageNumber ??
        chunk.metadata?.page ??
        1,

      chunkIndex: i,
      totalChunks: chunks.length,
    },
  }));

  console.log("Vectors:", vectors.length);

  try {

    console.log("Uploading to Pinecone...");

    await index.namespace(userId).upsert(vectors);

    console.log("Pinecone Upload Success");

  } catch (err) {

    console.error("========== PINECONE ERROR ==========");
    console.error(err);

    throw err;
  }

  return true;
};

// ==========================
// Search Chunks
// ==========================
const searchChunks = async (embedding, userId) => {

  console.log("Searching Pinecone...");

  const result = await index.namespace(userId).query({

    vector: embedding,

    topK: 10,

    includeMetadata: true,

  });

  console.log("Matches Found:", result.matches.length);

  result.matches.forEach((match, index) => {

    console.log({
      index: index + 1,
      score: match.score,
      file: match.metadata?.fileName,
      page: match.metadata?.page,
      preview: match.metadata?.text?.substring(0, 120),
    });

  });

  return result.matches;

};

// ==========================
// Delete Document Vectors
// ==========================
const deleteDocumentVectors = async (userId, documentId) => {

  console.log("Deleting Vectors...");

  await index.namespace(userId).deleteMany({

    documentId,

  });

  console.log("Vectors Deleted Successfully");

};

module.exports = {

  storeChunks,

  searchChunks,

  deleteDocumentVectors,

};