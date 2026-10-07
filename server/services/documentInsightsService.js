const groq = require("../config/groq");

const FALLBACK_MODEL = "openai/gpt-oss-20b";

function parseInsights(content) {
  if (typeof content !== "string") return null;

  try {
    const parsed = JSON.parse(content);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      Object.keys(parsed).length !== 2 ||
      !Object.prototype.hasOwnProperty.call(parsed, "summary") ||
      !Object.prototype.hasOwnProperty.call(parsed, "suggestedQuestions")
    ) {
      return null;
    }
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const suggestedQuestions = parsed.suggestedQuestions;
    if (
      !summary ||
      !Array.isArray(suggestedQuestions) ||
      suggestedQuestions.length !== 3 ||
      suggestedQuestions.some(
        (question) => typeof question !== "string" || !question.trim()
      )
    ) {
      return null;
    }

    return {
      summary,
      suggestedQuestions: suggestedQuestions.map((question) => question.trim()),
    };
  } catch {
    return null;
  }
}

async function generateDocumentInsights(text) {
  const sourceText = typeof text === "string" ? text.slice(0, 2500).trim() : "";
  if (!sourceText) {
    throw new Error("Cannot generate document insights without extracted PDF text.");
  }

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model: process.env.GROQ_SUMMARY_MODEL || FALLBACK_MODEL,
      temperature: 0,
      // gpt-oss spends completion tokens on internal reasoning. Keep that low
      // and reserve enough budget for the compact JSON response itself.
      reasoning_effort: "low",
      max_completion_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Return valid JSON only. The JSON object must have exactly these two fields: "summary" and "suggestedQuestions". The summary must be exactly 3 short sentences. suggestedQuestions must contain exactly 3 short questions. No markdown, no extra fields, no explanations, no source text. Use only information in the supplied text.',
        },
        {
          role: "user",
          content: `Return the required JSON using this document text:\n${sourceText}`,
        },
      ],
    });
  } catch (error) {
    const failure = new Error(
      `Document insights generation failed: ${error.message || "Groq request failed."}`
    );
    failure.cause = error;
    throw failure;
  }

  const insights = parseInsights(completion.choices?.[0]?.message?.content);
  if (!insights) {
    throw new Error("Groq returned malformed document insights.");
  }
  return insights;
}

module.exports = generateDocumentInsights;
