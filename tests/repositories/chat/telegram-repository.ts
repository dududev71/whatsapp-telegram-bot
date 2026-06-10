import type { Api } from "telegram";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import type {
  TelegramRepositoryChat,
  TelegramRepositoryChatProps,
} from "../../../src/domain/chat/repositories/telegram-repository";
import { Logger } from "telegram/extensions";
import { LogLevel } from "telegram/extensions/Logger";

export class TelegramChatRepositoryTest implements TelegramRepositoryChat {
  private client: TelegramClient;
  protected constructor(client: TelegramClient) {
    this.client = client;
  }

  static async handle() {
    const apiId = 37335293;
    const apiHash = "83be25e5aeb3167948f9b7fba5cf89b9";
    const stringSession = new StringSession(
      "1AQAOMTQ5LjE1NC4xNzUuNTgBu4w/+/FtQOSIOA5nURhzkEAnTWWtake/JZB4pLKqUkSNUlFkG1HU9Ihu+7cDqvDxyd+WtnmZXozm+3ODTkVA8XOEJEfwgIVKt4eMqUCSyfsG/exX8P1kW7WW1QL/n7Mowy+ScO6gUi0hHB1SitzTQ1fzxdx4btRbfytFWotLQd5Z8BdMvw6ZjPXob133Opg0i1lZNrImoEhR5zYzxxsthIMaqNM5iBBUIZSQtmiq4GRFVemhH54aBEptV16bwUo8fL5M6OhFvcpzqBsJ8DbZmNdKkqe8qMSPX4F0+uhu926iOfF7eM4uVKbn9laZ+b1AnN/q4RCDbcvLuz0/bgNzB3M=",
    );
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
      baseLogger: new Logger(LogLevel.NONE), // 🔕 desativa logs
    });
    await client.connect();
    return new TelegramChatRepositoryTest(client);
  }

  async readDataUri({
    chat,
    messageId,
  }: TelegramRepositoryChatProps): Promise<Api.Message> {
    const messageData = await this.client.getMessages(chat, {
      ids: messageId,
    });

    return messageData?.[0];
  }
}
