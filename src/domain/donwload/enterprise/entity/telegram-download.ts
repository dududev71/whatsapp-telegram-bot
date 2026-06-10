import { Entity } from "../../../../core/entities/entity";

export interface TelegramDownloadProps {
  uri: string;
  chat: string;
  messageId: number;
}

export class TelegramDownload extends Entity<TelegramDownloadProps> {
  get chat() {
    return this.props.chat;
  }
  get messageId() {
    return this.props.messageId;
  }
  static createFromUri(uri: string) {
    const splitedUri = uri.split("/");

    const chat = splitedUri[3];
    const messageId = Number(splitedUri[4]);

    const telegramDownload = new TelegramDownload({
      uri: uri,
      chat,
      messageId,
    });

    return telegramDownload;
  }
}
