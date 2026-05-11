import { convertResponse, getOutputFormattingPrompt } from "./zoho-cliq.js";
import { existsSync, readFileSync } from "node:fs";
import { ChatHistory } from "./chat-history.js";
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

async function buildMessages(chatId: string, message: string): Promise<UserMessage[]> {
  const messages: UserMessage[] = [];

  // Insert the SYSTEM prompt
  const systemPrompt = (readSystemPrompt() || "") + getOutputFormattingPrompt();

  messages.push({ content: systemPrompt, role: "system" as const });

  // Insert the chat history
  const chatHistory = new ChatHistory();

  const previousMessages = await chatHistory.getMessages(chatId);

  for (const previousMessage of previousMessages) {
    messages.push({ content: previousMessage.content, role: previousMessage.role });
  }

  // Insert the new message
  messages.push({ content: message, role: "user" as const });

  chatHistory.addUserMessage(chatId, message);

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

export async function chat(chatId: string, config: Config, message: string): Promise<string> {
  const messages = await buildMessages(chatId, message);

  const options = generateFetchOptions(config, messages);

  const completionsUrl = join(config.openAIBaseUrl, "chat", "completions");

  const completionJson = await fetch(completionsUrl, options);

  const completion = await completionJson.json();

  if (completion.choices.length === 0 || !completion.choices[0] || !completion.choices[0].message) {
    return "error";
  }

  const completionMessage = completion.choices[0].message;

  const chatHistory = new ChatHistory();

  chatHistory.addAssistantMessage(chatId, completionMessage.content);

  const response = convertResponse(completionMessage.content);

  return response;
}
