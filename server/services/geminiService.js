const groq = require("../config/groq");

async function generateAnswer(question, context) {

  // No relevant context
  if (!context || context.trim() === "") {
    return "I couldn't find the answer in the uploaded document.";
  }

  const prompt = `
You are PrepGenius AI.

You are a STRICT Retrieval-Augmented Generation (RAG) assistant.

You MUST answer ONLY from the CONTEXT provided below.

===========================
RULES
===========================

1. NEVER use your own knowledge.

2. NEVER guess.

3. NEVER assume anything that is not written in the context.

4. Every sentence in your answer must come from the context.

5. If the answer is missing or incomplete in the context, reply EXACTLY:

I couldn't find the answer in the uploaded document.

6. If the user asks:
   - Explain
   - Summarize
   - Interview Questions
   - MCQs
   - Viva Questions
   - Coding Questions
   - Examples

Generate them ONLY using the given context.

7. Format your answer in clean Markdown.

===========================
CONTEXT
===========================

${context}

===========================
QUESTION
===========================

${question}

Remember:
- Use ONLY the CONTEXT.
- Do NOT use outside knowledge.
- Do NOT infer.
- Do NOT complete missing information.
`;

  const completion = await groq.chat.completions.create({

    model: "llama-3.3-70b-versatile",

    temperature: 0,

    top_p: 0.1,

    max_tokens: 1024,

    messages: [

      {
        role: "system",
        content: `
You are a Retrieval-Augmented Generation (RAG) assistant.

You answer ONLY from the supplied context.

Never use external knowledge.

Never guess.

If the context is insufficient, reply exactly:

I couldn't find the answer in the uploaded document.
`,
      },

      {
        role: "user",
        content: prompt,
      },

    ],

  });

  return completion.choices[0].message.content.trim();

}

module.exports = generateAnswer;