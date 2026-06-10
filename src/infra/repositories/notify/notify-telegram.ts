import { writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import type { Telegraf } from 'telegraf'
import type { NotifyProps } from '../../../domain/notify/enterprise/notify'
import type {
  NotifyRepositoryPort,
  SendFileToJidInterface,
} from '../../../domain/notify/repositories/notify'

export class NotifyTelegramAdapter implements NotifyRepositoryPort {
  #bot: Telegraf
  constructor(bot: Telegraf) {
    this.#bot = bot
  }

  async sendFileToJid(data: SendFileToJidInterface): Promise<void> {
    try {
      const tempFile = join(process.cwd(), 'downloads', `temp_report_${Date.now()}.zip`)
      writeFileSync(tempFile, data.fileContent)
      
      await this.#bot.telegram.sendDocument(data.jidRecipient, tempFile, {
        caption: data.content,
      })
      
      try { unlinkSync(tempFile) } catch {}
    } catch (err) {
      console.error('Error sending file:', err)
    }
  }

  async sendNotifyToJid(data: NotifyProps): Promise<{ key: any }> {
    const sent = await this.#bot.telegram.sendMessage(data.jidRecipient, data.content)
    return { key: sent.message_id }
  }

  async editNotifyToJid(data: NotifyProps & { key: any }): Promise<void> {
    await this.#bot.telegram.editMessageText(
      data.jidRecipient,
      data.key,
      undefined,
      data.content,
    )
  }
}
