import type { EventDispatcher } from '../../../../events'
import type { NewNotifyEvent } from '../../../../events/send-notify-event'
import type { SendNotifyToJidService } from '../services/send-notify-to-jid'

export class OnSendNotifyRequested {
  constructor(
    private dispatcher: EventDispatcher,
    private classExecution: SendNotifyToJidService,
  ) {}

  register() {
    this.dispatcher.register('new-notify', this.handle.bind(this))
  }
  private async handle(event: NewNotifyEvent) {
    await this.classExecution.handle({
      content: event.payload.content,
      jidRecipient: event.payload.jidRecipient,
    })
  }
}
