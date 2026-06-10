import type { WASocket } from '@itsukichan/baileys'
import type { NotifyProps } from '../../../domain/notify/enterprise/notify'
import type {
  NotifyRepositoryPort,
  SendFileToJidInterface,
} from '../../../domain/notify/repositories/notify'

export class NotifyWhatsappAdapter implements NotifyRepositoryPort {
  #socket: WASocket
  constructor(socket: WASocket) {
    this.#socket = socket
  }
  async sendFileToJid(data: SendFileToJidInterface): Promise<void> {
    console.log('file content ', data.fileContent)
    try {
      await this.#socket.sendMessage(data.jidRecipient, {
        document: data.fileContent,
        mimetype: 'application/zip',
        fileName: 'report.zip',
        caption: data.content,
      })
    } catch (err) {
      console.error('erro ao enviar arquivo:', err)
    }
  }

  async sendNotifyToJid(data: NotifyProps): Promise<{ key: any }> {
    const sent = await this.#socket.sendMessage(data.jidRecipient, {
      text: data.content,
    })
    return { key: sent?.key }
  }

  async editNotifyToJid(data: NotifyProps & { key: any }): Promise<void> {
    await this.#socket.sendMessage(data.jidRecipient, {
      text: data.content,
      edit: data.key,
    })
  }
}
