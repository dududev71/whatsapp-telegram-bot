import type { NotifyRepositoryPort } from '../../repositories/notify'

export interface SendFileToJidServiceRequest {
  jidRecipient: string
  content: string
  fileContent: Buffer
}

export class SendFileToJidService {
  constructor(private notifyRepository: NotifyRepositoryPort) {}

  async handle({
    content,
    jidRecipient,
    fileContent,
  }: SendFileToJidServiceRequest): Promise<void> {
    await this.notifyRepository.sendFileToJid({
      content,
      fileContent,
      jidRecipient,
    })
  }
}
