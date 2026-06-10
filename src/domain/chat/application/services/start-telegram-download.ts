import { left, right, type Either } from '../../../../core/either'
import { UniqueEntityId } from '../../../../core/entities/uniqueEntityId'
import type { EventDispatcher } from '../../../../events'
import { DownloadRequestedEvent } from '../../../../events/download-request-event'
import type { CheckerSessionStore } from '../../../shared/checker/checker-session-store'
import type { DownloadsRepository } from '../../../shared/repositories/download-repository'
import type {
  TelegramMessageData,
  TelegramRepositoryChat,
} from '../../repositories/telegram-repository'

interface startTelegramDownloadServiceRequest {
  uri: string
  ownerPhone?: string
  OwnerUserName: string
  numberUserRequested: string
  jid: string
  signal: AbortSignal
}

interface startTelegramDownloadServiceResponse {
  numberUserRequested: string
  uri: string
  fileName: string
  message: TelegramMessageData
  OwnerUserName: string
  ownerPhone?: string | null
  downloadId: UniqueEntityId
  jid: string
  fileSize: number
}

export class startTelegramDownloadService {
  constructor(
    private TelegramRepository: TelegramRepositoryChat,
    private dispatcher: EventDispatcher,
    private downloadsRepositorys: DownloadsRepository,
  ) {}

  async handle({
    uri,
    numberUserRequested,
    OwnerUserName,
    ownerPhone,
    jid,
    signal,
  }: startTelegramDownloadServiceRequest): Promise<
    Either<string, startTelegramDownloadServiceResponse>
  > {
    try {
      const messageData = await this.TelegramRepository.readDataUri({
        uri: uri,
      })

      if (!messageData.hasDocument) throw new Error('No is Document')
      const fileName = messageData.fileName ?? `${messageData.id}`
      const findFileName =
        await this.downloadsRepositorys.findByFileName(fileName)
      if (findFileName) return left('File Exist in database.')

      const downloadData: startTelegramDownloadServiceResponse = {
        numberUserRequested,
        uri,
        fileName,
        message: messageData,
        OwnerUserName,
        ownerPhone: ownerPhone ?? null,
        downloadId: new UniqueEntityId(),
        jid,
        fileSize: messageData.fileSize,
      }

      this.dispatcher.dispatch(
        new DownloadRequestedEvent({ ...downloadData, signal }),
      )
      return right(downloadData)
    } catch (e) {
      console.log(e)
      return left('Error in fetch uri')
    }
  }
}
