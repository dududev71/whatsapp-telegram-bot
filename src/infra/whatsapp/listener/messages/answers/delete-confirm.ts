import { promises as fs } from 'node:fs'
import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'
import type { AnswerWating } from '../utils/answer-wating'

export class ConfirmAdapter implements AnswerCommands {
  answerKey = 'delete-confirm'

  async execute(
    { replys, dependencies, utils }: ExecuteAnswerProps,
    previousAnswer: AnswerWating,
  ): Promise<void> {
    if (utils.buttonReply.id === 'cancel') {
      return await replys.replyText('Deletion cancelled.')
    }

    const fileName = previousAnswer.stored?.buttonId as string
    const download = await dependencies.PrismaRepositoryDownloads.findByFileName(
      fileName,
    )
    if (!download) {
      return await replys.replyText('Download not found.')
    }

    await dependencies.PrismaRepositoryDownloads.deleteByFileName(fileName)

    try {
      await fs.unlink(download.localFile)
    } catch {
      // file may not exist on disk
    }

    await replys.replyText(`Deleted: ${fileName}`)
  }
}
