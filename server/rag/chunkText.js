const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

const chunkText = async (pages) => {
  const splitter = new RecursiveCharacterTextSplitter({

    chunkSize: 1000,

    chunkOverlap: 200,

    separators: [
      "\n\n",
      "\n",
      ". ",
      "? ",
      "! ",
      " ",
      ""
    ]

  });

  const pageList = Array.isArray(pages)
    ? pages
    : [{ page_number: 1, text: pages }];
  const chunks = [];

  for (const page of pageList) {
    if (!page.text?.trim()) continue;

    const pageChunks = await splitter.createDocuments(
      [page.text],
      [{ page_number: page.page_number }]
    );
    chunks.push(...pageChunks);
  }

  return chunks;

};

module.exports = chunkText;
