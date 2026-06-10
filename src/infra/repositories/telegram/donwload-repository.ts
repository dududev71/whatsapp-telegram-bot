import { copyFileSync, existsSync, statSync } from 'fs'
import type {
  TelegramRepositoryDownload,
  readDataUriProps,
} from '../../../domain/donwload/repositories/telegram-repository'
import { TelegramBaseRepository } from './connect'

export class TelegramDownloadRepository
  extends TelegramBaseRepository
  implements TelegramRepositoryDownload
{
  static async handle(): Promise<TelegramDownloadRepository> {
    const client = await TelegramBaseRepository.getClient()
    return new TelegramDownloadRepository(client)
  }

  async downloadFromUri(
    { uri, outputFile }: readDataUriProps,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    await this.#downloadFromLink(uri, outputFile, { onProgress, signal })
  }

  async #downloadFromLink(
    link: string,
    outputFile: string,
    options?: { onProgress?: (percent: number) => void; signal?: AbortSignal },
  ): Promise<void> {
    const onProgress = options?.onProgress
    const signal = options?.signal

    const linkInfo = await this.client.invoke({
      _: 'getMessageLinkInfo',
      url: link,
    })
    const content = linkInfo.message?.content as any
    const fileId =
      content?.document?.document?.id ??
      content?.video?.video?.id ??
      content?.audio?.audio?.id
    if (!fileId) throw new Error('Nenhum arquivo encontrado na mensagem')
    const totalSize = content?.document?.document?.size ?? 0

    const progressHandler = (update: any) => {
      if (update._ !== 'updateFile' || update.file.id !== fileId) return
      if (update.file.local.is_downloading_completed) {
        onProgress?.(100)
        return
      }
      const percent =
        totalSize > 0
          ? Math.floor((update.file.local.downloaded_size / totalSize) * 100)
          : 0
      onProgress?.(percent)
    }

    const cancelHandler = () => {
      this.client.invoke({
        _: 'cancelDownloadFile',
        file_id: fileId,
        only_if_pending: false,
      })
    }

    this.client.on('update', progressHandler)

    if (signal?.aborted) {
      this.client.removeListener('update', progressHandler)
      throw new Error('Download stopped before start')
    }

    signal?.addEventListener('abort', cancelHandler)

    await this.client.invoke({
      _: 'downloadFile',
      file_id: fileId,
      priority: 32,
      synchronous: false,
    })

    return new Promise<void>((resolve, reject) => {
      const poll = setInterval(async () => {
        if (signal?.aborted) {
          clearInterval(poll)
          this.client.removeListener('update', progressHandler)
          signal.removeEventListener('abort', cancelHandler)
          reject(new Error('Download stopped'))
          return
        }

        try {
          const file = await this.client.invoke({
            _: 'getFile',
            file_id: fileId,
          })
          if (file.local?.is_downloading_completed) {
            clearInterval(poll)
            this.client.removeListener('update', progressHandler)

            if (signal?.aborted) {
              reject(new Error('Download stopped after completion'))
              return
            }

            copyFileSync(file.local.path, outputFile)

            // Validate download size matches expected
            if (totalSize > 0) {
              const downloadedStats = statSync(outputFile)
              if (downloadedStats.size !== totalSize) {
                throw new Error(
                  `Download incomplete: expected ${totalSize} bytes, got ${downloadedStats.size} bytes`,
                )
              }
            }

            resolve()
          }
        } catch (err: any) {
          clearInterval(poll)
          this.client.removeListener('update', progressHandler)
          if (err.message === 'Download stopped') {
            reject(err)
          } else {
            reject(err)
          }
        }
      }, 500)
    }).finally(() => {
      signal?.removeEventListener('abort', cancelHandler)
    })
  }
}
