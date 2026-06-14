import { writeFileSync } from 'fs'
import { createRequire } from 'module'
import { Client } from 'pg'
// import { configure, createClient } from 'tdl'
import type {
    readDataUriProps,
    TelegramRepositoryDownload,
} from '../src/domain/donwload/repositories/telegram-repository'
const require = createRequire(import.meta.url)
const { tdl, getTdjson,configure, createClient } = require('./tdl-loader.cjs')
configure({ tdjson: getTdjson() })
export class TelegramDownloadRepository implements TelegramRepositoryDownload {
  #client: Client

  protected constructor(client: Client) {
    this.#client = client
  }
  downloadFromUri(
    data: readDataUriProps,
    callback?: (percent: number) => void,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }

  static async handle() {
    const client = createClient({
      apiId: 37335293,
      apiHash: '83be25e5aeb3167948f9b7fba5cf89b9',
      databaseDirectory: '.tdlib/db',
      filesDirectory: '.tdlib/files',
    })

    await client.login(() => ({
      getPhoneNumber: async () => {
        process.stdout.write('Phone number: ')
        return new Promise((resolve) => {
          process.stdin.once('data', (d) => resolve(d.toString().trim()))
        })
      },
      getAuthCode: async () => {
        process.stdout.write('Auth code: ')
        return new Promise((resolve) => {
          process.stdin.once('data', (d) => resolve(d.toString().trim()))
        })
      },
      getPassword: async () => {
        process.stdout.write('2FA password: ')
        return new Promise((resolve) => {
          process.stdin.once('data', (d) => resolve(d.toString().trim()))
        })
      },
    }))

    return new TelegramDownloadRepository(client)
  }

  async downloadFromLink(
    link: string,
    outputFile: string,
    onProgress = (p: number) => console.log(`${p}%`),
  ): Promise<void> {
    const linkInfo = await this.#client.invoke({
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
    this.#client.on('update', (update: any) => {
      if (update._ !== 'updateFile') return
      if (update.file.id !== fileId) return

      const downloaded = update.file.local.downloaded_size
      const percent =
        totalSize > 0 ? Math.floor((downloaded / totalSize) * 100) : 0
      onProgress(percent)
    })
    // Escuta updates de progresso

    const file = await this.#client.invoke({
      _: 'downloadFile',
      file_id: fileId,
      priority: 32,
      synchronous: true,
    })

    onProgress(100)
    writeFileSync(outputFile, file.local.path)
  }
}

;(async () => {
  const repo = await TelegramDownloadRepository.handle()
  await repo.downloadFromLink(
    'https://t.me/OBSERVERNEVERDIE/1044',
    './output.zip',
  )
})()
