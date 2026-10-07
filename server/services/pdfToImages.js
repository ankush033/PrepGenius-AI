const fs = require("fs");
const path = require("path");

// Render lazily so large PDFs do not keep every page image in memory at once.
async function* convertPDFToImages(filePath) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjsBuildDirectory = path.dirname(
    require.resolve("pdfjs-dist/legacy/build/pdf.mjs")
  );
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = getDocument({
    data,
    cMapUrl: path.join(pdfjsBuildDirectory, "../../cmaps/"),
    cMapPacked: true,
    standardFontDataUrl: path.join(pdfjsBuildDirectory, "../../standard_fonts/"),
  });
  const pdfDocument = await loadingTask.promise;

  try {
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvasAndContext = pdfDocument.canvasFactory.create(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height)
      );

      try {
        await page.render({
          canvasContext: canvasAndContext.context,
          viewport,
        }).promise;

        yield {
          page_number: pageNumber,
          total_pages: pdfDocument.numPages,
          image: canvasAndContext.canvas.toBuffer("image/png"),
        };
      } finally {
        pdfDocument.canvasFactory.destroy(canvasAndContext);
        page.cleanup();
      }
    }
  } finally {
    await pdfDocument.destroy();
  }
}

module.exports = convertPDFToImages;
