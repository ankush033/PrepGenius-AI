const Document = require("../models/Document");
const fs = require("fs/promises");

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
  let document = null;
  let vectorWriteStarted = false;
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
    console.info("PDF text extraction started.");
    let pages;
    try {
      pages = await loadPDF(req.file.path);
    } catch {
      // A valid PDF may be image-only or malformed for text extraction; retain OCR fallback.
      pages = [];
    }
    let text = pages.map((page) => page.text).join("\n\n");

    if (text.trim().length < 50) {
      console.info("Extracted text is insufficient; starting OCR fallback.");
      uploadStage = "OCR fallback";
      pages = await extractTextFromPDF(req.file.path);
      text = pages.map((page) => page.text).join("\n\n");
      console.info(`OCR completed (${pages.length} pages).`);
    }

    // Insights improve the document card and chat suggestions, but a temporary
    // model failure must not prevent the PDF and its RAG vectors from uploading.
    uploadStage = "document insights";
    let insights = { summary: "", suggestedQuestions: [] };
    try {
      insights = await generateDocumentInsights(text);
    } catch (insightsError) {
      console.error("Document insights generation failed; continuing upload.");
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

    // Chunk
    uploadStage = "chunking";
    const chunks = await chunkText(pages);

    if (chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No readable text found in PDF.",
      });
    }

    console.info(`Generating embeddings for ${chunks.length} chunks.`);

    const embeddings = [];

    for (const [index, chunk] of chunks.entries()) {
      uploadStage = `embedding chunk ${index + 1}/${chunks.length}`;
      const embedding = await generateEmbedding(chunk.pageContent);

      embeddings.push(embedding);

    }


    // Save MongoDB
    uploadStage = "MongoDB document creation";
    document = await Document.create({
      user: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      namespace: req.user.id,
      vectorCount: embeddings.length,
      processingStatus: "processing",
      summary: insights.summary,
      suggestedQuestions: insights.suggestedQuestions,
    });

    console.info("Document insights saved", {
      documentId: document._id.toString(),
      hasSummary: Boolean(document.summary?.trim()),
      suggestedQuestionCount: document.suggestedQuestions.length,
    });

    // Upload to Pinecone
    uploadStage = "Pinecone vector upsert";
    vectorWriteStarted = true;
    await storeChunks(
      chunks,
      embeddings,
      req.user.id,
      document._id.toString(),
      document.originalName
    );

    document.processingStatus = "ready";
    document.processingError = "";
    await document.save();

    return res.status(201).json({
      success: true,
      message: "PDF Uploaded Successfully",
      totalChunks: chunks.length,
      vectorsStored: embeddings.length,
      document,
    });
  } catch (error) {
    console.error(`Document upload failed during ${uploadStage}.`);
    if (document) {
      if (vectorWriteStarted) {
        try {
          await deleteDocumentVectors(req.user.id, document._id.toString());
        } catch {
          console.error("Failed to clean up partial Pinecone upload.");
        }
      }
      try {
        document.processingStatus = "failed";
        document.processingError = "Processing failed. You can delete this document and upload it again.";
        document.vectorCount = 0;
        await document.save();
      } catch {
        console.error("Failed to record document processing failure.");
      }
    }

    return res.status(500).json({
      success: false,
      message: `Upload failed during ${uploadStage}. Please retry, or delete the failed document before uploading again.`,
    });
  } finally {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
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
    console.error("Document listing failed.");

    return res.status(500).json({
      success: false,
      message: "Unable to load documents.",
    });
  }
};

// ======================================
// Delete Document
// ======================================

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, user: req.user.id });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Hide the document from retrieval before vector deletion begins. If the
    // remote delete times out after a partial effect, a retry can finish it.
    document.processingStatus = "failed";
    document.processingError = "Deletion is incomplete. Retry deleting this document.";
    await document.save();

    await deleteDocumentVectors(
      req.user.id,
      document._id.toString()
    );

    try {
      const deletion = await Document.deleteOne({ _id: document._id, user: req.user.id });
      if (deletion.deletedCount !== 1) throw new Error("Document record was not deleted.");
    } catch (databaseError) {
      document.processingStatus = "failed";
      document.processingError = "Vector cleanup completed but document cleanup failed. Retry deleting this document.";
      document.vectorCount = 0;
      await document.save().catch(() => {});
      throw databaseError;
    }

    return res.json({
      success: true,
      message: "Document Deleted Successfully",
    });
  } catch (err) {
    console.error("Delete document failed.");

    return res.status(500).json({
      success: false,
      message: "Unable to delete document. Please retry.",
    });
  }
};
