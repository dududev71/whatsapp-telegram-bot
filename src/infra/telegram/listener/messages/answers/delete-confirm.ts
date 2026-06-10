import { existsSync, rmSync } from 'node:fs'
import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'
import type { AnswerWating } from '../utils/answer-wating'

export class CommandAdpter implements AnswerCommands {
  answerKey = 'delete-confirm'

  async execute(
    { replys, dependencies, utils, answerWating }: ExecuteAnswerProps,
    previousAnswer: AnswerWating,
  ): Promise<void> {
    const action = utils.buttonReply.id || ''
    const fileName = previousAnswer.stored?.buttonId || ''

    if (action === 'confirm_delete' && fileName) {
      try {
        await dependencies.PrismaRepositoryDownloads.deleteByFileName(fileName)

        const downloadPath = `${process.cwd()}/downloads/${fileName}`
        if (existsSync(downloadPath)) {
          rmSync(downloadPath, { recursive: true, force: true })
        }

        await replys.replyText(`"${fileName}" deleted successfully.`)
      } catch (err) {
        console.error('Delete error:', err)
        await replys.replyText('Error deleting file. Try again.')
      }
    } else {
      await replys.replyText('Deletion cancelled.')
    }
  }
}
