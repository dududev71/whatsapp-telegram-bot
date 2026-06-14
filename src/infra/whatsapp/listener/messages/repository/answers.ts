import type { WAMessage } from '@itsukichan/baileys'
import type { depencies } from './deps'
import type { WaSocketReturnType } from '../../../../../@types/whatsapp'
import type { AnswerWating, AnswerWatings } from '../utils/answer-wating'

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

export interface ExecuteAnswerProps {
  socket: WaSocketReturnType
  replys: {
    replyText: (text: string) => Promise<void>
    replyButton: (data: ButtonsInterface) => Promise<void>
  }
  dependencies: depencies
  answerWating: AnswerWatings
  utils: {
    jid: string
    message: WAMessage
    userName: string
    phone: string
    restMessage: string[]
    buttonReply: {
      id: string | null
      text: string | null
    }
  }
}

export interface AnswerCommands {
  answerKey: string
  execute(data: ExecuteAnswerProps, previousAnswer: AnswerWating): Promise<void>
}
