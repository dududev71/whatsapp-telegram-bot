import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'
import type { AnswerWating } from '../utils/answer-wating'
import type { readArchiveAndCheckerRequest } from '../../../../../domain/checker/aplication/services/read-archive-and-checker'
import { CompactArchiveService } from '../../../../../domain/archives/aplication/services/compact-arquive'
import { readArchiveAndCheckerService } from '../../../../../domain/checker/aplication/services/read-archive-and-checker'

type Mode = readArchiveAndCheckerRequest['mode']

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
    const mode = (utils.buttonReply.id || 'silent') as Mode
    const stored = JSON.parse(previousAnswer.stored?.buttonId as string)
    const fileName = stored.fileName as string
    const selectedCheckers = stored.selectedCheckers as string[] | undefined
    const jid = utils.jid

    await replys.replyText('Checker started — type "/stop" to cancel')

    const readArchiveStarted = new readArchiveAndCheckerService(
      dependencies.PrismaRepositoryDownloads,
      dependencies.ReadArchives,
      dependencies.handleChecker,
      dependencies.NotifyRepository,
    )

    const signal = dependencies.CheckerSessionStore.startChecker(jid)

    const res = await readArchiveStarted.handle({
      fileName,
      jid,
      mode,
      signal,
      selectedCheckers,
    })
    if (res.isLeft()) return
    if (Object.keys(res.value).length === 0) return

    const compact = new CompactArchiveService(
      dependencies.archiveRepository,
      dependencies.dispatcher,
    )
    await compact.handle(res.value, jid)
  }
}
