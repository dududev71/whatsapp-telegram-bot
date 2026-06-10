import { HandleAnswer } from '../handles/handle-answer'
import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'

export interface AnswerWating {
  type: 'button' | 'text'
  toJid: string
  timeOut: number
  answerKey: string
  stored?: {
    buttonId: string
  }
}
export class AnswerWatings {
  private AnswerWating: AnswerWating[]
  private Commands: AnswerCommands[]

  protected constructor(
    answerWating: AnswerWating[],
    commands: AnswerCommands[],
  ) {
    this.AnswerWating = answerWating
    this.Commands = commands
  }

  static async handle() {
    const { commands } = await HandleAnswer.execute()

    return new AnswerWatings([], commands)
  }

  existWatingAnswerToJid(payload: ExecuteAnswerProps) {
    const userAnswerAndTypeAnswerEqual = this.AnswerWating.find(
      ({ toJid, type }) => {
        const isEqualJid = toJid === payload.utils.jid
        const responseIsButton = payload.utils.buttonReply.id ?? false
        const typeAnswerIsButton = type === 'button'
        const typeIsButtonAndResponseIsButton =
          typeAnswerIsButton && responseIsButton
        const typeNotIsButtonAndResponseNotButton =
          !typeAnswerIsButton && !responseIsButton

        return (
          isEqualJid &&
          (typeIsButtonAndResponseIsButton ||
            typeNotIsButtonAndResponseNotButton)
        )
      },
    )

    return userAnswerAndTypeAnswerEqual
  }
  async execute(payload: ExecuteAnswerProps) {
    const answerJid = this.AnswerWating.find(
      ({ toJid }) => toJid === payload.utils.jid,
    )
    const specificCommand = this.Commands.find(({ answerKey }) => {
      return answerKey === answerJid?.answerKey
    })
    if (specificCommand && answerJid)
      await specificCommand.execute(payload, answerJid)
  }
  // deleteClientByJidAndAnswerKey(jid: string, answerKeyProps: string) {
  //   console.log('anskey props ', answerKeyProps)
  //   const clientIndex = this.AnswerWating.findIndex(
  //     ({ toJid, answerKey }) => toJid === jid && answerKey === answerKeyProps,
  //   )
  //   console.log('clien index ', clientIndex)
  //   if (clientIndex <= 0) return
  //   this.AnswerWating.splice(clientIndex, 1)
  // }
  deleteClient(jid: string) {
    const clientIndex = this.AnswerWating.findIndex(
      ({ toJid }) => toJid === jid,
    )
    if (clientIndex < 0) return
    this.AnswerWating.splice(clientIndex, 1)
  }

  private async timeOut(answerWating: AnswerWating) {
    await new Promise((r) => setTimeout(() => r(1), answerWating.timeOut))
    this.deleteClient(answerWating.toJid)
  }

  SetAnswerWating(answerWating: AnswerWating) {
    this.deleteClient(answerWating.toJid)
    this.AnswerWating.push(answerWating)
    this.timeOut(answerWating)
  }
}
