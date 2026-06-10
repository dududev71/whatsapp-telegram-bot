import { FetchManyDownloadsInProgressService } from '../../../../../domain/chat/application/services/fetch-donwload-in-progress'
import type { Command, ExecuteProps } from '../repository/command'

export class CommandAdpter implements Command {
  name = 'status'

  async execute({ replys, dependencies }: ExecuteProps): Promise<void> {
    const startDownload = new FetchManyDownloadsInProgressService(
      dependencies.DownloadProgresStore,
    )
    const res = await startDownload.handle()
    if (res.isLeft()) return await replys.replyText('Commmand fail. try again')
    function formatFileName(fileName: string | null): string {
      if (!fileName) return 'unknown'
      // Remove números do final da extensão: .zip.004 -> .zip
      const cleaned = fileName.replace(/(\.\w+)\.\d+$/, '$1')
      const ext = cleaned.split('.').pop() ?? ''
      const name = cleaned.substring(0, cleaned.lastIndexOf('.'))
      const truncated = name.length > 20 ? name.substring(0, 20) + '...' : name
      return `${truncated}.${ext}`
    }

    function formatSize(bytes: number): string {
      if (bytes >= 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`
      return `${bytes}B`
    }

    if (res.value.length === 0)
      return await replys.replyText('No downloads in progress.')

    const formater = res.value.map(({ fileName, fileSize, porcent }) => {
      return `${formatFileName(fileName)} [${formatSize(fileSize)}] (${porcent}%)`
    })
    await replys.replyText(formater.join('\n'))
  }
}
