import type { Context } from 'telegraf';
import type { AnswerWatings } from '../utils/answer-wating';
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

export interface ExecuteProps {
  ctx: Context
  replys: {
    replyText: (text: string) => Promise<void>
    replyButton: (data: ButtonsInterface) => Promise<void>
  }
  answerWating: AnswerWatings
  dependencies: depencies
  utils: {
    jid: string
    message: Context['message']
    userName: string
    phone: string
    restMessage: string[]
  }
}

export interface Command {
  name: string
  execute(data: ExecuteProps): Promise<void>
}
