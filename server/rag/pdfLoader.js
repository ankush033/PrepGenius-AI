const fs = require("fs");
const pdfParse = require("pdf-parse");

const loadPDF = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);

    const data = await pdfParse(buffer);

    let cleaned = data.text;

    cleaned = cleaned
      .replace(/Scanned by CamScanner/gi, "")
      .replace(/Page\s+\d+/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();

    return cleaned;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to extract PDF text");
  }
};

module.exports = loadPDF;