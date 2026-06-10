import type { UniqueEntityId } from '../core/entities/uniqueEntityId'
import type { TelegramMessageData } from '../domain/chat/repositories/telegram-repository'
export class DownloadRequestedEvent {
  name = 'download.requested'

  constructor(
    public payload: {
      uri: string
      numberUserRequested: string
      message: TelegramMessageData
      fileName: string
      ownerPhone?: string | null
      OwnerUserName: string
      downloadId: UniqueEntityId
      jid: string
      fileSize: number
      signal: AbortSignal
    },
  ) {}
}
