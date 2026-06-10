import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'

export class CommandAdpter implements AnswerCommands {
  answerKey = 'chk-response'

  async execute({
    replys,
    dependencies,
    utils,
    answerWating,
  }: ExecuteAnswerProps): Promise<void> {
    answerWating.SetAnswerWating({
      timeOut: 60 * 1000,
      answerKey: 'chk-response-mode',
      toJid: utils.jid,
      type: 'button',
      stored: {
        buttonId: utils.buttonReply.id as string,
      },
    })
    await replys.replyButton({
      text: 'Select Mode',
      footer: 'density of notifications received',
      buttons: [
        {
          buttonId: 'anxiety',
          buttonText: {
            displayText: 'anxiety',
          },
        },
        {
          buttonId: 'time',
          buttonText: {
            displayText: 'time',
          },
        },
        {
          buttonId: 'silent',
          buttonText: {
            displayText: 'silent',
          },
        },
      ],
    })
  }
}
