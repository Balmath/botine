import { promises as fs } from "node:fs";
import path from "node:path";

// Message types according to Venice.ai API specification
// https://docs.venice.ai/api-reference/endpoint/chat/completions#body-messages

export interface BaseMessage {
  content: string;
  name?: string | undefined;
}

export interface UserMessage extends BaseMessage {
  role: "user";
}

export interface AssistantMessage extends BaseMessage {
  role: "assistant";
}

export interface ToolMessage extends BaseMessage {
  role: "tool";
  tool_call_id: string;
  reasoning_content?: string | undefined;
}

export type ChatMessage = UserMessage | AssistantMessage | ToolMessage;

export type MessageRole = ChatMessage["role"];

/**
 * Create a message based on role
 */
function createMessage(
  content: string,
  role: MessageRole,
  options: {
    name?: string | undefined;
    reasoning_content?: string | undefined;
    tool_call_id?: string | undefined;
  } = {},
): ChatMessage {
  switch (role) {
    case "user": {
      return { content, name: options.name, role: "user" };
    }
    case "assistant": {
      return { content, name: options.name, role: "assistant" };
    }
    case "tool": {
      if (!options.tool_call_id) {
        throw new Error("tool_call_id is required for tool role messages");
      }
      return {
        content,
        name: options.name,
        reasoning_content: options.reasoning_content,
        role: "tool",
        tool_call_id: options.tool_call_id,
      };
    }
    default: {
      throw new Error(`Invalid message role: ${role}`);
    }
  }
}

/**
 * Parse the lines of chat messages
 */
function parseMessages(fileContent: string): ChatMessage[] {
  const lines = fileContent
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "");

  // Parse all messages
  return lines.map((line) => {
    try {
      return JSON.parse(line) as ChatMessage;
    } catch (error) {
      throw new Error("Failed to parse a message from chat history", { cause: error });
    }
  });
}

/**
 * Limit the number of messages based on the user role
 */
function filterMessages(messages: ChatMessage[], limit: number): ChatMessage[] {
  const result: ChatMessage[] = [];
  let count = 0;

  for (let index = messages.length - 1; index >= 0 && count < limit; index -= 1) {
    const message = messages[index];

    if (message) {
      if (message.role === "user") {
        count += 1;
      }

      result.unshift(message);
    }
  }

  return result;
}

/**
 * Stores chat messages in JSONL format
 * Each line is a JSON object representing a message
 * Filename format: chat-{chatId}.jsonl
 */
export class ChatHistory {
  private storageDir: string;

  constructor(storageDir = "/var/lib/botine/chats") {
    this.storageDir = storageDir;
  }

  /**
   * Ensure the storage directory exists
   */
  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      throw new Error("Failed to create storage directory", { cause: error });
    }
  }

  /**
   * Get the file path for a specific chat ID
   */
  private getChatFilePath(chatId: string): string {
    return path.join(this.storageDir, `chat-${chatId}.jsonl`);
  }

  /**
   * Add a message to a specific chat history
   * @param chatId - The chat ID to store the message in
   * @param message - The message content
   * @param role - The role of the message (user, assistant, tool)
   * @param tool_call_id - Required for tool role messages
   * @param reasoning_content - Optional reasoning content for tool messages
   * @returns Promise<void>
   */
  async addMessage(
    chatId: string,
    content: string,
    role: MessageRole,
    options: {
      tool_call_id?: string | undefined;
      reasoning_content?: string | undefined;
      name?: string | undefined;
    } = {},
  ): Promise<void> {
    await this.ensureStorageDir();

    const filePath = this.getChatFilePath(chatId);

    // Create the message object based on role
    const message = createMessage(content, role, options);

    // Append to the JSONL file
    try {
      await fs.appendFile(filePath, `${JSON.stringify(message)}\n`);
    } catch (error) {
      throw new Error("Failed to add message to chat history", { cause: error });
    }
  }

  /**
   * Retrieve the last N messages from a specific chat history
   * Messages are returned in chronological order (oldest to newest)
   * @param chatId - The chat ID to retrieve messages from
   * @param limit - Maximum number of messages to retrieve (default: 100)
   * @returns Promise<ChatMessage[]> - Array of chat messages
   */
  async getMessages(chatId: string, limit = 10): Promise<ChatMessage[]> {
    const filePath = this.getChatFilePath(chatId);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      // File doesn't exist, return empty array
      return [];
    }

    try {
      // Read all lines from the file
      const fileContent = await fs.readFile(filePath, "utf8");

      // Parse all messages
      const messages = parseMessages(fileContent);

      return filterMessages(messages, limit);
    } catch (error) {
      throw new Error("Failed to retrieve messages from chat history", { cause: error });
    }
  }

  /**
   * Utility method to add a user message
   */
  async addUserMessage(chatId: string, content: string, name?: string | undefined): Promise<void> {
    await this.addMessage(chatId, content, "user", { name });
  }

  /**
   * Utility method to add an assistant message
   */
  async addAssistantMessage(
    chatId: string,
    content: string,
    name?: string | undefined,
  ): Promise<void> {
    await this.addMessage(chatId, content, "assistant", { name });
  }

  /**
   * Utility method to add a tool message
   */
  async addToolMessage(
    chatId: string,
    content: string,
    options: {
      tool_call_id: string;
      reasoning_content?: string | undefined;
      name?: string | undefined;
    },
  ): Promise<void> {
    await this.addMessage(chatId, content, "tool", options);
  }
}

export default ChatHistory;
