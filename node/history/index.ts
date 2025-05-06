/*
 * @Author: linqibin
 * @Date: 2025-05-06 10:43:26
 * @LastEditors: linqibin
 * @LastEditTime: 2025-05-06 11:10:56
 * @Description:
 *
 * Copyright (c) 2025 by 智慧空间研究院/金地空间科技, All Rights Reserved.
 */
import { BaseListChatMessageHistory } from "@langchain/core/chat_history"
import { BaseMessage, StoredMessage, mapChatMessagesToStoredMessages, mapStoredMessagesToChatMessages } from "@langchain/core/messages";
import fs from "node:fs";
import path from "node:path";

export interface JSONChatHistoryInput {
  sessionId: string;
  dir: string;
}

export class JSONChatHistory extends BaseListChatMessageHistory  {
  lc_namespace = ["langchain", "stores", "message"];

  sessionId: string;
  dir: string;

  constructor(fields: JSONChatHistoryInput) {
    super(fields);
    this.sessionId = fields.sessionId;
    this.dir = fields.dir;
  }

  async getMessages(): Promise<BaseMessage[]> {
    const filePath = path.join(this.dir, `${this.sessionId}.json`);
    try {
      if (!fs.existsSync(filePath)) {
        this.saveMessagesToFile([]);
        return [];
      }
      const data = fs.readFileSync(filePath, { encoding: "utf-8" });
      const storedMessages = JSON.parse(data) as StoredMessage[];
      return mapStoredMessagesToChatMessages(storedMessages);
    } catch (error) {
      console.error(`Failed to read chat history from ${filePath}`, error);
      return []
    }
  }

  async addMessage(message: BaseMessage): Promise<void> {
    const messages = await this.getMessages();
    messages.push(message);
    await this.saveMessagesToFile(messages);
  }

  async addMessages(messages: BaseMessage[]): Promise<void> {
    const currentMessages = await this.getMessages();
    const newMessages = [...currentMessages, ...messages];
    await this.saveMessagesToFile(newMessages);
  }

  async clear(): Promise<void> {
    const filePath = path.join(this.dir, `${this.sessionId}.json`);
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Failed to clear chat history from ${filePath}`, error);
    }
  }

  private async saveMessagesToFile(messages: BaseMessage[]): Promise<void> {
    const filePath = path.join(this.dir, `${this.sessionId}.json`);
    const serializedMessages = mapChatMessagesToStoredMessages(messages);
    try {
      fs.writeFileSync(filePath, JSON.stringify(serializedMessages, null, 2), { encoding: "utf-8" });
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  }
}