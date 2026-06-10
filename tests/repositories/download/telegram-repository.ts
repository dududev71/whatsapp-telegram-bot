import { Logger, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import type {
  readDataUriProps,
  TelegramRepositoryDownload,
} from "../../../src/domain/donwload/repositories/telegram-repository";
import { LogLevel } from "telegram/extensions/Logger";

export class TelegramDownloadRepositoryTests implements TelegramRepositoryDownload {
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
      baseLogger: new Logger(LogLevel.NONE),
    });
    await client.connect();
    return new TelegramDownloadRepositoryTests(client);
  }

  async downloadFromUri(
    { message, outputFile }: readDataUriProps,
    onProgress: (percent: number) => void, // <-- callback
  ): Promise<void> {
    await this.client.downloadMedia(message, {
      outputFile,
      progressCallback: (downloaded, total) => {
        if (!total) return;
        const percent = Math.floor(
          (downloaded.toJSNumber() / total.toJSNumber()) * 100,
        );
        onProgress(percent);
      },
    });
  }
}
