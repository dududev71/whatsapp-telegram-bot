import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'
import type { AnswerWating } from '../utils/answer-wating'
import { readArchiveAndCheckerService } from '../../../../../domain/checker/aplication/services/read-archive-and-checker'
import { CompactArchiveService } from '../../../../../domain/chat/archives/aplication/services/compact-arquive'

export async function getSavedCheckersCount(dependencies: any, jid: string): Promise<number> {
  const saved = await dependencies.CheckerProfileRepository.findByJid(jid)
  return saved?.checkers.length ?? 0
}

export class CommandAdpter implements AnswerCommands {
  answerKey = 'chk-response-mode'

  async execute(
    { replys, dependencies, utils, answerWating }: ExecuteAnswerProps,
    previousAnswer: AnswerWating,
  ): Promise<void> {
    const mode = (utils.buttonReply.id || 'silent') as 'anxiety' | 'time' | 'silent'
    const stored = JSON.parse(previousAnswer.stored?.buttonId || '{}')
    const fileName = stored.fileName || ''
    const selectedCheckers = stored.selectedCheckers as string[] | undefined
    const jid = utils.jid

    await replys.replyText('Checker started — type "/stop" to cancel')

    // Run checker in background to avoid blocking Telegraf response
    const runChecker = async () => {
      try {
        console.log(`[CHK] Starting checker for "${fileName}" in ${mode} mode`)
        
        const readArchiveStarted = new readArchiveAndCheckerService(
          dependencies.PrismaRepositoryDownloads,
          dependencies.ReadArchives,
          dependencies.handleChecker,
          dependencies.NotifyRepository,
        )

        const signal = dependencies.CheckerSessionStore.startChecker(jid)
        console.log(`[CHK] Signal created, starting processing...`)

        const res = await readArchiveStarted.handle({
          fileName,
          jid,
          mode,
          signal,
          selectedCheckers,
        })
        
        if (res.isLeft()) {
          console.log(`[CHK] Left result: ${res.value}`)
          return
        }
        
        const resultCount = Object.keys(res.value).length
        console.log(`[CHK] Completed with ${resultCount} checker results`)
        
        if (resultCount === 0) return

        const compact = new CompactArchiveService(
          dependencies.archiveRepository,
          dependencies.dispatcher,
        )
        await compact.handle(res.value, jid)
        console.log(`[CHK] Compact finished`)
      } catch (err) {
        console.error('[CHK] Error:', err)
      }
    }

    runChecker()
  }
}
