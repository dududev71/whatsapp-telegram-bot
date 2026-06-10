import type {
  TelegramMessageData,
  TelegramRepositoryChat,
  TelegramRepositoryChatProps,
} from '../../../domain/chat/repositories/telegram-repository'
import { TelegramBaseRepository } from './connect'

export class TelegramChatRepository
  extends TelegramBaseRepository
  implements TelegramRepositoryChat
{
  static async handle() {
    const client = await TelegramBaseRepository.getClient()
    return new TelegramChatRepository(client)
  }

  async readDataUri({
    uri,
  }: TelegramRepositoryChatProps): Promise<TelegramMessageData> {
    const result = await this.client.invoke({
      _: 'getMessageLinkInfo',
      url: uri,
    })

    const message = result.message
    const content = message?.content as any
    const fileName = content?.document?.file_name ?? null
    const fileSize = content?.document?.document?.size ?? 0
    const hasDocument = content?._ === 'messageDocument'

    return {
      id: message?.id ?? 0,
      fileName,
      hasDocument,
      raw: message,
      fileSize,
    }
  }
}
