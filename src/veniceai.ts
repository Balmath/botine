import { convertResponse, getOutputFormattingPrompt } from "./zoho-cliq.js";
import { existsSync, readFileSync } from "node:fs";
import type { Config } from "./types.js";
import { join } from "node:path";

interface UserMessage {
  content: string;
  role: string;
  name?: string;
}

function readSystemPrompt(): string | undefined {
  const systemFilePath = "/etc/botine/system.md";

  if (!existsSync(systemFilePath)) {
    return undefined;
  }

  return readFileSync(systemFilePath, "utf8");
}

function buildMessages(message: string): UserMessage[] {
  const messages: UserMessage[] = [];

  const systemPrompt = (readSystemPrompt() || "") + getOutputFormattingPrompt();

  messages.push({ content: systemPrompt, role: "system" as const });

  messages.push({ content: message, role: "user" as const });

  return messages;
}

function generateFetchOptions(config: Config, messages: UserMessage[]): RequestInit {
  return {
    body: JSON.stringify({
      messages,
      model: config.openAIModel,
      venice_parameters: {
        include_venice_system_prompt: false,
      },
    }),
    headers: { Authorization: `Bearer ${config.openAIApiKey}`, "Content-Type": "application/json" },
    method: "POST",
  };
}

export async function chat(config: Config, message: string): Promise<string> {
  const messages = buildMessages(message);

  const options = generateFetchOptions(config, messages);

  const completionsUrl = join(config.openAIBaseUrl, "chat", "completions");

  const completionJson = await fetch(completionsUrl, options);

  const completion = await completionJson.json();

  if (completion.choices.length === 0 || !completion.choices[0] || !completion.choices[0].message) {
    return "error";
  }

  const response = convertResponse(completion.choices[0].message.content);

  return response;
}
