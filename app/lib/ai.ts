type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const DEFAULT_MODEL = "gpt-4.1-mini";
const API_URL = "https://models.inference.ai.azure.com/chat/completions";

export async function generateSummary(text: string) {
  const apiKey = process.env.GITHUB_MODELS_API_KEY;
  const model = process.env.GITHUB_MODELS_MODEL ?? DEFAULT_MODEL;

  if (!apiKey) {
    throw new Error("Missing GitHub Models API key");
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a precise assistant that summarizes documents. Respond in Chinese with a concise overview, key bullet points, and a short action list if applicable.",
    },
    {
      role: "user",
      content: `Summarize the following document:\n\n${text}`,
    },
  ];

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub Models API error: ${errorText}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const summary = data.choices?.[0]?.message?.content?.trim();

  if (!summary) {
    throw new Error("No summary returned by model");
  }

  return summary;
}
