import type { EventDispatcher } from '../../../../events'
import type { NewFileReportEvent } from '../../../../events/send-file-report'
import type { SendFileToJidService } from '../services/send-file-to-jid'

export class OnSendFileRequested {
  constructor(
    private dispatcher: EventDispatcher,
    private classExecution: SendFileToJidService,
  ) {}

  register() {
    this.dispatcher.register('new-report', this.handle.bind(this))
  }
  private async handle(event: NewFileReportEvent) {
    await this.classExecution.handle({
      content: event.payload.content,
      jidRecipient: event.payload.jidRecipient,
      fileContent: event.payload.fileContent,
    })
  }
}
