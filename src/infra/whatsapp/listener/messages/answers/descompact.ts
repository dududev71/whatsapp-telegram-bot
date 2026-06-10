import { DescompactArchiveService } from "../../../../../domain/archives/aplication/services/descompact-archive"
import { AnswerCommands, ExecuteAnswerProps } from "../repository/answers"

export class CommandAdpter implements AnswerCommands {
  answerKey = 'descompact-response'

  async execute({
    replys,
    dependencies,
    utils,
  }: ExecuteAnswerProps): Promise<void> {
    const descompact = new DescompactArchiveService(
      dependencies.archiveRepository,
      dependencies.PrismaRepositoryDownloads,
    )

    const res = await descompact.handle({
      fileName: utils.buttonReply.id as string,
      password: utils.restMessage?.[1],
    })
    await replys.replyText(res.value)
  }
}
