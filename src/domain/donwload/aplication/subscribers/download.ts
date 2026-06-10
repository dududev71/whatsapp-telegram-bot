import type { EventDispatcher } from '../../../../events'
import type { DownloadRequestedEvent } from '../../../../events/download-request-event'
import type { TelegramDownloadService } from '../services/telegram-download'
export class OnDownloadRequested {
  constructor(
    private dispatcher: EventDispatcher,
    private service: TelegramDownloadService,
  ) {}

  register() {
    this.dispatcher.register('download.requested', this.handle.bind(this))
  }

  private async handle(event: DownloadRequestedEvent) {
    await this.service.handle({
      downloadId: event.payload.downloadId,
      uri: event.payload.uri,
      numberUserRequested: event.payload.numberUserRequested,
      fileName: event.payload.fileName,
      OwnerUserName: event.payload.OwnerUserName,
      message: event.payload.message,
      ownerPhone: event.payload.ownerPhone,
      porcent: 0,
      jid: event.payload.jid,
      fileSize: event.payload.fileSize,
      signal: event.payload.signal,
    })
  }
}
