import type { Config } from "./types.js";

const DEFAULT_PORT = 8325;
const BOTINE_API_KEY_REGEXP = /^[a-zA-Z0-9\-_]{42}$/;

function validateRequiredString(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} missing.`);
  }

  return value as string;
}

function validateBotineApiKey(value: string | undefined): string {
  const botineApiKey = validateRequiredString(value, "Botine API key");

  if (!BOTINE_API_KEY_REGEXP.test(botineApiKey)) {
    throw new Error(`Invalid Botine API key.`);
  }

  return botineApiKey as string;
}

export function loadConfig(): Config {
  const { BOTINE_API_KEY, BOTINE_PORT, OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL } =
    process.env;

  return {
    botineApiKey: validateBotineApiKey(BOTINE_API_KEY),
    openAIApiKey: validateRequiredString(OPENAI_API_KEY, "OpenAI API key"),
    openAIBaseUrl: validateRequiredString(OPENAI_BASE_URL, "OpenAI base url"),
    openAIModel: validateRequiredString(OPENAI_MODEL, "OpenAI model"),
    port: BOTINE_PORT ? Number.parseInt(BOTINE_PORT, 10) : DEFAULT_PORT,
  };
}
