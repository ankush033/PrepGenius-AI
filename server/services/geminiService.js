const groq = require("../config/groq");

async function generateAnswer(question, context) {

  if (!context || context.trim() === "") {
    return "I couldn't find the answer in the uploaded document.";
  }

  const prompt = `
You are PrepGenius AI.

You are a STRICT Retrieval-Augmented Generation (RAG) assistant.

You MUST answer ONLY from the supplied CONTEXT.

=========================
RULES
=========================

1. NEVER use your own knowledge.

2. NEVER guess.

3. NEVER add information that is not present in the context.

4. If multiple context chunks contain relevant information,
combine them into one complete answer.

5. If the user asks to:
- Explain
- Summarize
- Compare
- Interview Questions
- Viva Questions
- MCQs
- Coding Questions

Generate them ONLY using the supplied context.

6. If the answer is not available in the context, reply EXACTLY:

I couldn't find the answer in the uploaded document.

7. Use Markdown formatting.

8. Use headings and bullet points whenever appropriate.

=========================
CONTEXT
=========================

${context}

=========================
QUESTION
=========================

${question}

Remember:

- Use ONLY the context.
- Do NOT use external knowledge.
- Do NOT fabricate information.
`;

  const completion = await groq.chat.completions.create({

    model: "llama-3.3-70b-versatile",

    temperature: 0,

    top_p: 0.1,

    max_tokens: 1200,

    messages: [
      {
        role: "system",
        content: `
You are a Retrieval-Augmented Generation assistant.

You answer ONLY from the supplied context.

Never use outside knowledge.

Never guess.

If the answer is missing, reply exactly:

I couldn't find the answer in the uploaded document.
`
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return completion.choices[0].message.content.trim();

}

module.exports = generateAnswer;