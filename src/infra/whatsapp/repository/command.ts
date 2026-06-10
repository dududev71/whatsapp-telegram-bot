import type { WAMessage } from '@itsukichan/baileys'
import type { depencies } from '..'
import type { WaSocketReturnType } from '../../../../../@types/whatsapp'
import type { AnswerWatings } from '../utils/answer-wating'

export interface ButtonsInterface {
  text: string // image: buffer or // image: { url: url } If you want to use images
  // caption: "caption", // Use this if you are using an image or video
  footer: string
  buttons: {
    buttonId: string
    buttonText: {
      displayText: string
    }
  }[]
}

export interface ExecuteProps {
  socket: WaSocketReturnType
  replys: {
    replyText: (text: string) => Promise<void>

    replyButton: (data: ButtonsInterface) => Promise<void>
  }
  answerWating: AnswerWatings
  dependencies: depencies
  utils: {
    jid: string
    message: WAMessage
    userName: string
    phone: string
    restMessage: string[]
  }
}

export interface Command {
  name: string
  execute(data: ExecuteProps): Promise<void>
}