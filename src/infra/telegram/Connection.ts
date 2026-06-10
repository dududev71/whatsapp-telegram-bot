import 'dotenv/config'
import { Telegraf } from 'telegraf'
import { Config } from '../config'

export class TelegramConnection {
  public bot: Telegraf
  private started = false

  constructor(bot: Telegraf) {
    this.bot = bot
  }

  static async handle(): Promise<TelegramConnection> {
    const token = Config.TELEGRAM_BOT_TOKEN
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN not found in .env')
    }

    const bot = new Telegraf(token)
    const connection = new TelegramConnection(bot)

    process.once('SIGINT', () => {
      if (connection.started) bot.stop('IT')
    })
    process.once('SIGTERM', () => {
      if (connection.started) bot.stop('IT')
    })

    return connection
  }

  launch() {
    this.bot.launch()
    this.started = true
  }
}
