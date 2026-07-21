const tesseract = require("node-tesseract-ocr");

const config = {
  lang: "eng",
  oem: 1,
  psm: 3,
};

async function extractTextFromImage(imagePath) {
  try {
    const text = await tesseract.recognize(imagePath, config);
    return text;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = extractTextFromImage;