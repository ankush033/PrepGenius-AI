const index = require("../config/pinecone");
const generateEmbedding = require("./embeddingService");

const retrieveChunks = async (question, userId) => {

    // Generate embedding for user question
    const embedding = await generateEmbedding(question);

    console.log("Searching Pinecone...");

    // Search similar vectors
    const result = await index.namespace(userId).query({
        vector: embedding,
        topK: 5,
        includeMetadata: true
    });

    console.log("Matches Found :", result.matches.length);

    return result.matches;

};

module.exports = retrieveChunks;