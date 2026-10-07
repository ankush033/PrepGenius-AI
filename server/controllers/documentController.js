const Document = require("../models/Document");

const loadPDF = require("../rag/pdfLoader");
const chunkText = require("../rag/chunkText");

const generateEmbedding = require("../services/embeddingService");
const generateDocumentInsights = require("../services/documentInsightsService");
const extractTextFromPDF = require("../services/ocrService");

const {
  storeChunks,
  deleteDocumentVectors,
} = require("../services/pineconeService");

// ======================================
// Upload Document
// ======================================

exports.uploadDocument = async (req, res) => {
  let uploadStage = "request validation";
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No File Uploaded",
      });
    }

    uploadStage = "duplicate check";
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

    // Load each PDF page separately so page numbers remain available to RAG.
    uploadStage = "PDF text extraction";
    console.info(`Upload ${req.file.originalname}: extracting PDF text.`);
    let pages = await loadPDF(req.file.path);
    let text = pages.map((page) => page.text).join("\n\n");

    if (text.trim().length < 50) {
      console.info(`Upload ${req.file.originalname}: extracted ${text.trim().length} characters; starting OCR fallback.`);
      uploadStage = "OCR fallback";
      pages = await extractTextFromPDF(req.file.path);
      text = pages.map((page) => page.text).join("\n\n");
      console.info(`Upload ${req.file.originalname}: OCR completed (${pages.length} pages, ${text.trim().length} characters).`);
    }

    // Insights improve the document card and chat suggestions, but a temporary
    // model failure must not prevent the PDF and its RAG vectors from uploading.
    uploadStage = "document insights";
    let insights = { summary: "", suggestedQuestions: [] };
    try {
      insights = await generateDocumentInsights(text);
    } catch (insightsError) {
      console.error("Document insights generation failed; continuing upload:", insightsError);
    }

    // Clean each page independently, preserving the page number on its chunks.
    pages = pages.map(({ page_number, text: pageText }) => ({
      page_number,
      text: pageText
        .replace(/\r/g, "")
        .replace(/\n{2,}/g, "\n")
        .replace(/\n\d+\n/g, "\n")
        .replace(
          /\d{2}-\d{2}-\d{4}.*?COMPUTER SCIENCE AND ENGINEERING DEPARTMENT/gi,
          ""
        )
        .replace(/[ \t]+/g, " ")
        .trim(),
    }));
    text = pages.map((page) => page.text).join("\n\n");

    console.log("========================================");
    console.log("PDF TEXT (First 500 Characters)");
    console.log(text.substring(0, 500));

    // Chunk
    uploadStage = "chunking";
    const chunks = await chunkText(pages);

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

    for (const [index, chunk] of chunks.entries()) {
      uploadStage = `embedding chunk ${index + 1}/${chunks.length}`;
      const embedding = await generateEmbedding(chunk.pageContent);

      embeddings.push(embedding);

      console.log(
        `Embedding ${embeddings.length}/${chunks.length} Generated`
      );
    }

    console.log("Embeddings Generated :", embeddings.length);

    // Save MongoDB
    uploadStage = "MongoDB document creation";
    const document = await Document.create({
      user: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      namespace: req.user.id,
      vectorCount: embeddings.length,
      summary: insights.summary,
      suggestedQuestions: insights.suggestedQuestions,
    });

    console.info("Document insights saved", {
      documentId: document._id.toString(),
      hasSummary: Boolean(document.summary?.trim()),
      suggestedQuestionCount: document.suggestedQuestions.length,
    });

    // Upload to Pinecone
    console.log("Uploading to Pinecone...");

    uploadStage = "Pinecone vector upsert";
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
    console.error(`Document upload failed during ${uploadStage}:`, error);

    return res.status(500).json({
      success: false,
      message: `Upload failed during ${uploadStage}: ${error.message || "Unexpected server error."}`,
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
    console.error("Delete Document Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
