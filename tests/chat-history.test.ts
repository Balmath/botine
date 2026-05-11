import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ChatHistory from "../src/chat-history";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

vi.setConfig({ testTimeout: 1000 });

describe("ChatHistory Class", () => {
  const testDir = path.join(os.tmpdir(), `botine-test-chats-${Date.now()}`);
  const chatHistory: ChatHistory = new ChatHistory(testDir);

  beforeEach(async () => {
    // Clean up test directory before each test
    await fs.rm(testDir, { force: true, recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory after each test
    await fs.rm(testDir, { force: true, recursive: true });
  });

  describe("addMessage", () => {
    it("should add a user message to chat history", async () => {
      const chatId = "test-chat-1";
      await chatHistory.addUserMessage(chatId, "Hello, how are you?");

      const messages = await chatHistory.getMessages(chatId);
      expect(messages.length).toBe(1);
      expect(messages[0].role).toBe("user");
      expect(messages[0].content).toBe("Hello, how are you?");
    });

    it("should add an assistant message to chat history", async () => {
      const chatId = "test-chat-2";
      await chatHistory.addAssistantMessage(chatId, "I am doing well, thank you!");

      const messages = await chatHistory.getMessages(chatId);
      expect(messages.length).toBe(1);
      expect(messages[0].role).toBe("assistant");
      expect(messages[0].content).toBe("I am doing well, thank you!");
    });

    it("should add a tool message to chat history", async () => {
      const chatId = "test-chat-5";
      await chatHistory.addToolMessage(chatId, "Tool execution result: 42", {
        tool_call_id: "call_12345",
      });

      const messages = await chatHistory.getMessages(chatId);
      expect(messages.length).toBe(1);
      expect(messages[0].role).toBe("tool");
      expect(messages[0].content).toBe("Tool execution result: 42");
      expect((messages[0] as ToolMessage).tool_call_id).toBe("call_12345");
    });

    it("should add a tool message with reasoning content", async () => {
      const chatId = "test-chat-6";
      await chatHistory.addToolMessage(chatId, "Calculated result", {
        reasoning_content: "Thinking process...",
        tool_call_id: "call_67890",
      });

      const messages = await chatHistory.getMessages(chatId);
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe("Calculated result");
      expect((messages[0] as ToolMessage).reasoning_content).toBe("Thinking process...");
    });

    it("should add multiple messages to the same chat", async () => {
      const chatId = "test-chat-7";
      await chatHistory.addUserMessage(chatId, "First message");
      await chatHistory.addAssistantMessage(chatId, "Reply to first message");
      await chatHistory.addUserMessage(chatId, "Second message");

      const messages = await chatHistory.getMessages(chatId);
      expect(messages.length).toBe(3);
      expect(messages[0].role).toBe("user");
      expect(messages[0].content).toBe("First message");
      expect(messages[1].role).toBe("assistant");
      expect(messages[2].role).toBe("user");
      expect(messages[2].content).toBe("Second message");
    });

    it("should store messages in different chat files", async () => {
      const chatId1 = "chat-1";
      const chatId2 = "chat-2";

      await chatHistory.addUserMessage(chatId1, "Message in chat 1");
      await chatHistory.addUserMessage(chatId2, "Message in chat 2");

      const messages1 = await chatHistory.getMessages(chatId1);
      const messages2 = await chatHistory.getMessages(chatId2);

      expect(messages1.length).toBe(1);
      expect(messages1[0].content).toBe("Message in chat 1");
      expect(messages2.length).toBe(1);
      expect(messages2[0].content).toBe("Message in chat 2");
    });

    it("should throw error when tool_call_id is missing for tool message", async () => {
      const chatId = "test-chat-8";

      await expect(chatHistory.addMessage(chatId, "Invalid tool message", "tool")).rejects.toThrow(
        "tool_call_id is required for tool role messages",
      );
    });
  });

  describe("getMessages", () => {
    it("should return all messages if limit is greater than total messages", async () => {
      const chatId = "test-chat-9";
      await chatHistory.addUserMessage(chatId, "Message 1");
      await chatHistory.addAssistantMessage(chatId, "Message 2");

      const messages = await chatHistory.getMessages(chatId, 100);
      expect(messages.length).toBe(2);
    });

    it("should return last N messages when limit is specified", async () => {
      const chatId = "test-chat-10";
      await chatHistory.addUserMessage(chatId, "Message 1");
      await chatHistory.addAssistantMessage(chatId, "Message 2");
      await chatHistory.addUserMessage(chatId, "Message 3");
      await chatHistory.addAssistantMessage(chatId, "Message 4");
      await chatHistory.addUserMessage(chatId, "Message 5");

      const messages = await chatHistory.getMessages(chatId, 2);
      expect(messages.length).toBe(3);
      expect(messages[0].content).toBe("Message 3");
      expect(messages[1].content).toBe("Message 4");
      expect(messages[2].content).toBe("Message 5");
    });

    it("should return messages in chronological order (oldest to newest)", async () => {
      const chatId = "test-chat-11";
      await chatHistory.addUserMessage(chatId, "Message 1");
      await chatHistory.addAssistantMessage(chatId, "Message 2");
      await chatHistory.addUserMessage(chatId, "Message 3");

      const messages = await chatHistory.getMessages(chatId);
      expect(messages.length).toBe(3);
      expect(messages[0].content).toBe("Message 1");
      expect(messages[1].content).toBe("Message 2");
      expect(messages[2].content).toBe("Message 3");
    });

    it("should return empty array when chat file does not exist", async () => {
      const chatId = "non-existent-chat";
      const messages = await chatHistory.getMessages(chatId);
      expect(messages).toEqual([]);
    });

    it("should return empty array when chat file does not exist", async () => {
      const chatId = "non-existent-chat-2";
      const messages = await chatHistory.getMessages(chatId);
      expect(messages).toEqual([]);
    });
  });

  describe("JSONL format", () => {
    it("should store messages in JSONL format (one JSON object per line)", async () => {
      const chatId = "test-chat-12";
      await chatHistory.addUserMessage(chatId, "Hello");
      await chatHistory.addAssistantMessage(chatId, "Hi there");

      const filePath = path.join(testDir, `chat-${chatId}.jsonl`);
      const fileContent = await fs.readFile(filePath, "utf8");

      const lines = fileContent.trim().split("\n");
      expect(lines.length).toBe(2);

      expect(() => JSON.parse(lines[0])).not.toThrow();
      expect(() => JSON.parse(lines[1])).not.toThrow();
    });

    it("should be able to parse messages from JSONL file", async () => {
      const chatId = "test-chat-13";
      await chatHistory.addUserMessage(chatId, "Test message");

      const filePath = path.join(testDir, `chat-${chatId}.jsonl`);
      const fileContent = await fs.readFile(filePath, "utf8");
      const lines = fileContent.trim().split("\n");

      const parsed = lines.map((line) => JSON.parse(line));
      expect(parsed[0].role).toBe("user");
      expect(parsed[0].content).toBe("Test message");
    });
  });

  describe("File naming convention", () => {
    it("should use correct file naming pattern: chat-{chatId}.jsonl", async () => {
      const chatId = "my-chat-id";
      await chatHistory.addUserMessage(chatId, "Test");

      const filePath = path.join(testDir, `chat-${chatId}.jsonl`);
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);
    });
  });

  describe("Message with name property", () => {
    it("should handle messages with name property", async () => {
      const chatId = "test-chat-14";
      await chatHistory.addUserMessage(chatId, "User question", "john");

      const messages = await chatHistory.getMessages(chatId);
      expect(messages[0].name).toBe("john");
      expect(messages[0].content).toBe("User question");
    });
  });
});

describe("ChatHistory Default Export", () => {
  it("should export ChatHistory as default", async () => {
    const chatHistory = new ChatHistory();
    expect(chatHistory).toBeInstanceOf(ChatHistory);
  });
});
