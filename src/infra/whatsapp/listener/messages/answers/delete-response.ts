import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'
import type { AnswerWating } from '../utils/answer-wating'

export class CommandAdpter implements AnswerCommands {
  answerKey = 'delete-response'

  async execute(
    { replys, dependencies, utils, answerWating }: ExecuteAnswerProps,
    previousAnswer: AnswerWating,
  ): Promise<void> {
    const fileName = utils.buttonReply.id as string
    const download = await dependencies.PrismaRepositoryDownloads.findByFileName(
      fileName,
    )
    if (!download) {
      return await replys.replyText('Download not found.')
    }

    answerWating.SetAnswerWating({
      answerKey: 'delete-confirm',
      timeOut: 30 * 1000,
      toJid: utils.jid,
      type: 'button',
      stored: {
        buttonId: fileName,
      },
    })

    await replys.replyButton({
      footer: 'This action cannot be undone',
      text: `Are you sure you want to delete "${fileName}"?\n\nThis will remove the file from disk and the database.`,
      buttons: [
        {
          buttonId: 'confirm',
          buttonText: {
            displayText: 'Yes, delete',
          },
        },
        {
          buttonId: 'cancel',
          buttonText: {
            displayText: 'Cancel',
          },
        },
      ],
    })
  }
}
