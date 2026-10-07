const groq = require("../config/groq");

function normalizePageCitations(text) {
  return text.replace(/\[Page[\s\u00a0\u202f]+(\d+)\]/giu, "[Page $1]");
}

async function generateAnswer(question, context, chatHistory = [], options = {}) {
  const hasContext = Boolean(context && context.trim());
  const hasHistory = Array.isArray(chatHistory) && chatHistory.some(
    (message) =>
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.trim()
  );

  if (!hasContext && !hasHistory) {
    return "I couldn't find the answer in the uploaded document.";
  }

  // System Prompt
  const systemPrompt = `
You are PrepGenius AI, a Retrieval-Augmented Generation assistant with conversation memory.
Use the conversation history to understand references to earlier questions and answers, including requests to explain or expand something you already said.
Use supplied document context together with conversation history when it is available. For claims based on the documents, use only the supplied context and never guess or use outside knowledge.
When no relevant document context is available, you may explain or elaborate on information already present in the conversation history, but do not add unsupported facts.
If the requested information is absent from both the supplied context and conversation history, reply exactly: "I couldn't find the answer in the uploaded document."
Always use Markdown formatting (headings, bullet points, tables) to make the answer highly readable.
When using supplied document context, cite sources by appending the page number at the end of the supported sentence, like this: [Page 4].
Use the page number provided in each source context. Do not invent page numbers.
`;

  // Current Question Prompt
  const currentPrompt = `
=========================
RETRIEVED DOCUMENT CONTEXT
=========================
${hasContext ? context : "No relevant document chunks were retrieved for this question."}

=========================
QUESTION
=========================
${question}

Use the conversation history to resolve references in the question. Combine it with the retrieved document context when relevant. Keep citations attached to claims supported by retrieved document context.
`;

  // Build message array with history
  const messages = [
    { role: "system", content: systemPrompt }
  ];

  // History is stored oldest first and contains only completed prior turns.
  for (const msg of chatHistory) {
    if ((msg.role === "user" || msg.role === "assistant") && msg.content?.trim()) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Push the current prompt at the end
  messages.push({ role: "user", content: currentPrompt });

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-20b",
    temperature: 0,
    top_p: 0.1,
    max_tokens: 1200,
    messages,
    stream: typeof options.onToken === "function",
  });

  if (typeof options.onToken !== "function") {
    return normalizePageCitations(completion.choices[0].message.content.trim());
  }

  let answer = "";
  for await (const chunk of completion) {
    const token = chunk.choices?.[0]?.delta?.content || "";
    if (token) {
      answer += token;
      options.onToken(token);
    }
  }
  return normalizePageCitations(answer.trim());
}

module.exports = generateAnswer;
