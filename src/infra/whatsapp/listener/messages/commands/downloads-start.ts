import { startTelegramDownloadService } from '../../../../../domain/chat/application/services/start-telegram-download'
import type { Command, ExecuteProps } from '../repository/command'

export class CommandAdpter implements Command {
  name = 'd'

  async execute({ replys, utils, dependencies }: ExecuteProps): Promise<void> {
    const { success } = dependencies.CheckerSessionStore.abort(utils.jid)
    if (success) {
      return await replys.replyText('There is already an active download in progress.')
    }

    const signal = dependencies.CheckerSessionStore.startDownload(utils.jid)
    const startDownload = new startTelegramDownloadService(
      dependencies.TelegramChatRepository,
      dependencies.dispatcher,
      dependencies.PrismaRepositoryDownloads,
    )
    const res = await startDownload.handle({
      OwnerUserName: utils.userName,
      numberUserRequested: utils.jid,
      ownerPhone: utils.phone,
      uri: utils.restMessage?.[1],
      jid: utils.jid,
      signal,
    })
    if (res.isLeft())
      return await replys.replyText(`Command failed. reason: ${res.value}`)

    await replys.replyText(
      'Download started. use /status to view progress or /stop to cancel.',
    )
  }
}
