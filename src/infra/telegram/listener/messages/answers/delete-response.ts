import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'
import type { AnswerWating } from '../utils/answer-wating'

export class CommandAdpter implements AnswerCommands {
  answerKey = 'delete-response'

  async execute(
    { replys, dependencies, utils, answerWating }: ExecuteAnswerProps,
    previousAnswer: AnswerWating,
  ): Promise<void> {
    const fileName = utils.buttonReply.id || ''

    if (!fileName) {
      return await replys.replyText('No file selected.')
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
      text: `Delete "${fileName}"?`,
      footer: 'This action cannot be undone',
      buttons: [
        { buttonId: 'confirm_delete', buttonText: { displayText: 'Yes, delete' } },
        { buttonId: 'cancel_delete', buttonText: { displayText: 'Cancel' } },
      ],
    })
  }
}
