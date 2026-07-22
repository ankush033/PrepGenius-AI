const index = require("../config/pinecone");
const generateEmbedding = require("./embeddingService");

const retrieveChunks = async (question, userId) => {
  try {
    // Generate embedding
    const embedding = await generateEmbedding(question);

    console.log("Searching Pinecone...");

    const result = await index.namespace(userId).query({
      vector: embedding,
      topK: 10,
      includeMetadata: true,
    });

    console.log("Matches Found:", result.matches.length);

    if (!result.matches || result.matches.length === 0) {
      return [];
    }

    // Debugging
    result.matches.forEach((match, index) => {
      console.log({
        Match: index + 1,
        Score: match.score,
        File: match.metadata.fileName,
        Text: match.metadata.text.substring(0, 120),
      });
    });

    // Remove very weak matches
    const filtered = result.matches.filter(
      (match) => match.score >= 0.65
    );

    console.log("Filtered Matches:", filtered.length);

    return filtered;
  } catch (err) {
    console.error("Retrieve Error:", err);
    throw err;
  }
};

module.exports = retrieveChunks;