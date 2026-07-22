const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

const chunkText = async (text) => {

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

  return await splitter.createDocuments([text]);

};

module.exports = chunkText;