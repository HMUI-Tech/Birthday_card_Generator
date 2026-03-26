import OpenAI from "openai";

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI is not configured. Set OPENAI_API_KEY to enable AI generation.");
  }

  return new OpenAI({ apiKey });
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-5-mini";
}
