import { left, right } from '../../../../core/either'
import type { NotifyRepositoryPort } from '../../../notify/repositories/notify'
import type { ReportForCompact } from '../../../shared/arquives/interfaces/compact'
import type { DownloadsRepository } from '../../../shared/repositories/download-repository'
import type { HandleSourcesPort } from '../../repositories/handle-sources'
import type { ReadArchives } from '../../repositories/read-archive'

export type readArchiveAndCheckerRequest = {
  fileName: string
  jid: string
  mode: 'silent' | 'time' | 'anxiety'
  signal?: AbortSignal
  selectedCheckers?: string[]
}

export class readArchiveAndCheckerService {
  constructor(
    private downloadsSaved: DownloadsRepository,
    private readArchives: ReadArchives,
    private handleChecker: HandleSourcesPort,
    private notifyRepository: NotifyRepositoryPort, // 👈 injeta direto
  ) {}

  async handle({
    fileName,
    jid,
    mode,
    signal,
    selectedCheckers,
  }: readArchiveAndCheckerRequest) {
    const archivePersistente =
      await this.downloadsSaved.findByFileName(fileName)
    const allResults: ReportForCompact = {}

    if (!archivePersistente) {
      console.log('[CHK] Archive not found in database')
      return left('Archive not found.')
    }
    if (archivePersistente.isCompact) {
      console.log('[CHK] Archive is compact, skipping')
      return left('Archive compact.')
    }
    console.log(`[CHK] Found archive: ${archivePersistente.localFile}`)

    // envia mensagem inicial e guarda a key

    let interval: NodeJS.Timeout | null = null
    let messageKey: any = null
    let accumulatedContent = ''

    // anxiety: envia mensagem inicial
    if (mode === 'anxiety') {
      accumulatedContent = `Processing files ...`
      const sent = await this.notifyRepository.sendNotifyToJid({
        content: accumulatedContent,
        jidRecipient: jid,
      })
      messageKey = sent?.key
    }

    let lastSentIndex = 0 // 👈 controla o que já foi enviado

    if (mode === 'time') {
      interval = setInterval(
        async () => {
          const allFlat = Object.values(allResults).flat()
          const newItems = allFlat.slice(lastSentIndex) // 👈 só os novos
          if (!newItems.length) return

          const content = newItems.map((r) => r.report).join('\n')
          lastSentIndex = allFlat.length // 👈 atualiza o offset

          await this.notifyRepository.sendNotifyToJid({
            content: `Report (3min)\n\n${content}`,
            jidRecipient: jid,
          })
        },
        60 * 1000 * 3,
      )
    }

    let wasStopped = false

    let fileIndex = 0
    for await (const fileContent of this.readArchives.readArchive(
      archivePersistente.localFile,
    )) {
      if (signal?.aborted) {
        wasStopped = true
        console.log('[CHK] Aborted by user')
        break
      }

      fileIndex++
      if (fileIndex % 10 === 0) {
        console.log(`[CHK] Processing file ${fileIndex}...`)
      }

      const reportsFile = await this.handleChecker.execute(fileContent, selectedCheckers)
      if (reportsFile.length <= 0) continue

      const allReportosToString = reportsFile
        .map(({ report }) => report)
        .join('\n')

      for (const { cookies, report, checkerName } of reportsFile) {
        const payload = { name: checkerName, cookie: cookies, report }
        if (!allResults[checkerName]) {
          allResults[checkerName] = [payload]
          continue
        }
        allResults[checkerName].push(payload)
      }

      // anxiety: edita a mensagem existente acumulando
      const ANXIETY_DELAY_MS = 3000 // 👈 ajusta aqui

      if (mode === 'anxiety' && messageKey) {
        accumulatedContent += `\n\n${allReportosToString}`
        await new Promise<void>((resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new Error('stop')), {
            signal,
          });
          setTimeout(resolve, ANXIETY_DELAY_MS)
        }).catch((err: Error) => {
          if (err.message === 'stop') wasStopped = true
        });
        if (wasStopped) break
        await this.notifyRepository.editNotifyToJid({
          content: accumulatedContent,
          jidRecipient: jid,
          key: messageKey,
        })
      }
    }

    if (interval) clearInterval(interval)
    console.log(`[CHK] Finished processing ${fileIndex} files`)

    // send final report even when stopped
    if (wasStopped) {
      const summary = this.formatReport(allResults)
      await this.notifyRepository.sendNotifyToJid({
        content: `Checker stopped by user.\n\n${summary}`,
        jidRecipient: jid,
      })
    }

    // Save cookie reports to database
    await this.downloadsSaved.saveCookieReports(fileName, allResults)

    return right(allResults)
  }

  private formatReport(allResults: ReportForCompact): string {
    const entries = Object.entries(allResults)
    if (entries.length === 0) return 'No results found.'

    return entries
      .map(([checkerName, items]) => {
        const reports = items.map((i) => i.report).join('\n')
        return `## ${checkerName}\n\n${reports}`
      })
      .join('\n\n')
  }
}
