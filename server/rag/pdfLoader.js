const fs = require("fs");
const pdfParse = require("pdf-parse");

const loadPDF = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const pages = [];
    let renderedPageNumber = 0;

    await pdfParse(buffer, {
      pagerender: async (pageData) => {
        // pdf-parse calls pagerender sequentially, starting at PDF page 1.
        const pageNumber = ++renderedPageNumber;
        const textContent = await pageData.getTextContent({
          normalizeWhitespace: false,
          disableCombineTextItems: false,
        });

        let lastY;
        let text = "";
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || lastY === undefined) {
            text += item.str;
          } else {
            text += `\n${item.str}`;
          }
          lastY = item.transform[5];
        }

        pages.push({ page_number: pageNumber, text });
        return text;
      },
    });

    return pages.map(({ page_number, text }) => ({
      page_number,
      text: text
        .replace(/Scanned by CamScanner/gi, "")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .trim(),
    }));
  } catch (error) {
    console.error(error);
    throw new Error("Failed to extract PDF text");
  }
};

module.exports = loadPDF;
