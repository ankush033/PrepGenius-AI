const { createWorker } = require("tesseract.js");
const convertPDFToImages = require("./pdfToImages");

async function extractTextFromPDF(filePath) {
  const worker = await createWorker("eng");
  const pages = [];
  let totalPages = 0;

  try {
    for await (const { page_number, total_pages, image } of convertPDFToImages(filePath)) {
      totalPages = total_pages;
      const result = await worker.recognize(image);
      pages.push({
        page_number,
        text: result.data.text.trim(),
      });
      console.info(
        `OCR completed page ${page_number}${totalPages ? `/${totalPages}` : ""} (${result.data.text.trim().length} characters).`
      );
    }
  } finally {
    await worker.terminate();
  }

  return pages;
}

module.exports = extractTextFromPDF;
