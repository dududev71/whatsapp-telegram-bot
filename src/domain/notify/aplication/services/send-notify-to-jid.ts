import type { NotifyRepositoryPort } from '../../repositories/notify'

export interface SendNotifyToJidServiceRequest {
  jidRecipient: string
  content: string
}

export class SendNotifyToJidService {
  constructor(private notifyRepository: NotifyRepositoryPort) {}

  async handle({
    content,
    jidRecipient,
  }: SendNotifyToJidServiceRequest): Promise<void> {
    await this.notifyRepository.sendNotifyToJid({
      content,
      jidRecipient,
    })
  }
}
