import type { Context } from 'telegraf';
import type { AnswerWating, AnswerWatings } from '../utils/answer-wating';
import type { depencies } from './deps'; // ✅ era: from '..'

export interface ButtonsInterface {
  text: string
  footer: string
  buttons: {
    buttonId: string
    buttonText: {
      displayText: string
    }
  }[]
}

export interface ExecuteAnswerProps {
  ctx: Context
  replys: {
    replyText: (text: string) => Promise<void>
    replyButton: (data: ButtonsInterface) => Promise<void>
  }
  dependencies: depencies
  answerWating: AnswerWatings
  utils: {
    jid: string
    message: Context['message']
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
