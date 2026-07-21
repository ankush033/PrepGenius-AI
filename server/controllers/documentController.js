const Document = require("../models/Document");

const loadPDF = require("../rag/pdfLoader");
const chunkText = require("../rag/chunkText");

const generateEmbedding = require("../services/embeddingService");

const {
  storeChunks,
  deleteDocumentVectors,
} = require("../services/pineconeService");

// ======================================
// Upload Document
// ======================================

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No File Uploaded",
      });
    }

    // Duplicate Check
    const existing = await Document.findOne({
      user: req.user.id,
      originalName: req.file.originalname,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This document is already uploaded.",
      });
    }

    // Load PDF
    let text = await loadPDF(req.file.path);

    // Clean Text
    text = text
      .replace(/\r/g, "")
      .replace(/\n{2,}/g, "\n")
      .replace(/\n\d+\n/g, "\n")
      .replace(
        /\d{2}-\d{2}-\d{4}.*?COMPUTER SCIENCE AND ENGINEERING DEPARTMENT/gi,
        ""
      )
      .replace(/[ \t]+/g, " ")
      .trim();

    console.log("========================================");
    console.log("PDF TEXT (First 500 Characters)");
    console.log(text.substring(0, 500));

    // Chunk
    const chunks = await chunkText(text);

    if (chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No readable text found in PDF.",
      });
    }

    console.log("Total Chunks :", chunks.length);

    // Generate Embeddings
    console.log("Generating Embeddings...");

    const embeddings = [];

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.pageContent);

      embeddings.push(embedding);

      console.log(
        `Embedding ${embeddings.length}/${chunks.length} Generated`
      );
    }

    console.log("Embeddings Generated :", embeddings.length);

    // Save MongoDB
    const document = await Document.create({
      user: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      namespace: req.user.id,
      vectorCount: embeddings.length,
    });

    // Upload to Pinecone
    console.log("Uploading to Pinecone...");

    await storeChunks(
      chunks,
      embeddings,
      req.user.id,
      document._id.toString(),
      document.originalName
    );

    console.log("Vectors Uploaded Successfully");

    return res.status(201).json({
      success: true,
      message: "PDF Uploaded Successfully",
      totalChunks: chunks.length,
      vectorsStored: embeddings.length,
      document,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get Documents
// ======================================

exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      documents,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================
// Delete Document
// ======================================

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await deleteDocumentVectors(
      req.user.id,
      document._id.toString()
    );

    await Document.findByIdAndDelete(document._id);

    return res.json({
      success: true,
      message: "Document Deleted Successfully",
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};