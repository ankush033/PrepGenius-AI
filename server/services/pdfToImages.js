const pdf = require("pdf-poppler");
const path = require("path");
const fs = require("fs");

async function convertPDF(pdfPath) {
  try {

    const outputDir = path.join(__dirname, "../temp");

    // temp folder create if not exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log("================================");
    console.log("Converting PDF to Images...");
    console.log("PDF Path:", pdfPath);
    console.log("Output Folder:", outputDir);

    const options = {
      format: "png",
      out_dir: outputDir,
      out_prefix: "page",
      page: null,
    };

    await pdf.convert(pdfPath, options);

    console.log("✅ PDF Converted Successfully");

    const files = fs.readdirSync(outputDir);

    console.log("Generated Files:", files);

    return outputDir;

  } catch (err) {

    console.error("❌ PDF Conversion Failed");
    console.error(err);

    throw err;

  }
}

module.exports = convertPDF;