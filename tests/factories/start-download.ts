import { startTelegramDownloadService } from "../../src/domain/chat/application/services/start-telegram-download";
import { EventDispatcher } from "../../src/events";
import { TelegramChatRepositoryTest } from "../repositories/chat/telegram-repository";

export async function makeStartDownload() {
  const dispatcher = new EventDispatcher();
  const telegramRepository = await TelegramChatRepositoryTest.handle();
  const sut = new startTelegramDownloadService(telegramRepository, dispatcher);

  const download = await sut.handle({
    uri: "https://t.me/OBSERVERCLOUDULPNEW/1512",
    numberUserRequested: "98988156622",
    OwnerUserName: "duduzzk71",
  });
  return download;
}
