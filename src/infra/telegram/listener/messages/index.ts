import type { Context } from 'telegraf'
import type { TelegramConnection } from '../../Connection'
import type { ArchivesRepository } from '../../../../domain/chat/archives/repositories/arquives'
import type { HandleSourcesPort } from '../../../../domain/checker/repositories/handle-sources'
import type { ReadArchives } from '../../../../domain/checker/repositories/read-archive'
import { TelegramDownloadService } from '../../../../domain/donwload/aplication/services/telegram-download'
import { OnDownloadRequested } from '../../../../domain/donwload/aplication/subscribers/download'
import type { DownloadRequestedEvent } from '../../../../events/download-request-event'
import { SendFileToJidService } from '../../../../domain/notify/aplication/services/send-file-to-jid'
import { SendNotifyToJidService } from '../../../../domain/notify/aplication/services/send-notify-to-jid'
import { OnSendFileRequested } from '../../../../domain/notify/aplication/subiscriber/send-file-report'
import { OnSendNotifyRequested } from '../../../../domain/notify/aplication/subiscriber/send-notify-subscriber'
import type { NotifyRepositoryPort } from '../../../../domain/notify/repositories/notify'
import { CheckerSessionStore } from '../../../../domain/shared/checker/checker-session-store'
import type { CheckerProfileRepository } from '../../../../domain/shared/repositories/checker-profile'
import { PrismaRepositoryCheckerProfile } from '../../../repositories/prisma/prisma-repository-checker-profile.js'

import type { NetflixCookies } from '../../../../domain/chat/repositories/netflix'
import { DownloadProgresStore } from '../../../../domain/shared/download/donowload-progress-store'
import { EventDispatcher } from '../../../../events'
import { ArchivesRepositoryAdapter } from '../../../repositories/arquives/arquives'
import { ReadArchivesAdapter } from '../../../repositories/arquives/read-arquives-adpater'
import { HandleSources } from '../../../repositories/checkers/handle'
import { NetflixCookiesAdapter } from '../../../repositories/netflix'
import { NotifyTelegramAdapter } from '../../../repositories/notify/notify-telegram'
import { PrismaRepositoryDownloads } from '../../../repositories/prisma/prisma-repository-downloads'
import { TelegramChatRepository } from '../../../repositories/telegram/chat-repository'
import { TelegramDownloadRepository } from '../../../repositories/telegram/donwload-repository'
import { HandleCommands } from './handles/handle-main-commands'
import type { ExecuteAnswerProps } from './repository/answers'
import type { ButtonsInterface, ExecuteProps } from './repository/command'
import { AnswerWatings } from './utils/answer-wating'

interface Settings {
  prefix: string
  readHistory: boolean
}

export interface depencies {
  ensureTdLibInitialized: () => Promise<{
    downloadService: TelegramDownloadService
    telegramChatRepository: TelegramChatRepository
  }>
  DownloadProgresStore: DownloadProgresStore
  CheckerSessionStore: CheckerSessionStore
  CheckerProfileRepository: CheckerProfileRepository
  PrismaRepositoryDownloads: PrismaRepositoryDownloads
  dispatcher: EventDispatcher
  archiveRepository: ArchivesRepository
  ReadArchives: ReadArchives
  handleChecker: HandleSourcesPort
  NotifyRepository: NotifyRepositoryPort
  NetflixRepository: NetflixCookies
}

export class TelegramListener {
  private settings: Settings

  protected constructor(
    private socket: TelegramConnection,
    private depencies: depencies,
    settings?: Settings,
  ) {
    this.settings = {
      ...settings,
      prefix: '/',
      readHistory: false,
    }
  }

  static async start(socket: TelegramConnection, settings?: Settings) {
    const dispatcher = new EventDispatcher()
    
    const sharedProgress = new DownloadProgresStore()
    const checkerSessionStore = new CheckerSessionStore()
    const checkerProfileRepository = new PrismaRepositoryCheckerProfile()
    const downloadsRepository = new PrismaRepositoryDownloads()

    const archiveRepository = new ArchivesRepositoryAdapter()
    const handleSources = await HandleSources.start()
    const ReadArchives = new ReadArchivesAdapter()
    const notifyRepository = new NotifyTelegramAdapter(socket.bot)
    
    // Lazy-loaded TDLib repositories - initialized on first command use
    let telegramChatRepository: TelegramChatRepository | null = null
    let telegramDownloadRepository: TelegramDownloadRepository | null = null
    let downloadService: TelegramDownloadService | null = null
    let tdLibInitPromise: Promise<void> | null = null
    
    const ensureTdLibInitialized = async () => {
      if (downloadService) return { downloadService, telegramChatRepository: telegramChatRepository! }
      
      // If initialization is already in progress, wait for it
      if (tdLibInitPromise) {
        await tdLibInitPromise
        return { downloadService: downloadService!, telegramChatRepository: telegramChatRepository! }
      }
      
      // Start initialization
      tdLibInitPromise = (async () => {
        telegramChatRepository = await TelegramChatRepository.handle()
        telegramDownloadRepository = await TelegramDownloadRepository.handle()
        
        downloadService = new TelegramDownloadService(
          telegramDownloadRepository,
          sharedProgress,
          downloadsRepository,
          dispatcher,
          archiveRepository,
        )
      })()
      
      await tdLibInitPromise
      return { downloadService, telegramChatRepository: telegramChatRepository! }
    }
    const sendNotifyService = new SendNotifyToJidService(notifyRepository)
    const netflixRepository = new NetflixCookiesAdapter()
    const onSendNotifyRequestSubscriber = new OnSendNotifyRequested(
      dispatcher,
      sendNotifyService,
    )
    const sendFileToJid = new SendFileToJidService(notifyRepository)
    const onSendFileRequested = new OnSendFileRequested(
      dispatcher,
      sendFileToJid,
    )
    
    // Lazy download subscriber - initializes TDLib on first download request
    class LazyDownloadSubscriber {
      private subscriber: OnDownloadRequested | null = null
      
      register() {
        dispatcher.register('download.requested', this.handle.bind(this))
      }
      
      private async handle(event: DownloadRequestedEvent) {
        if (!this.subscriber) {
          const { downloadService } = await ensureTdLibInitialized()
          this.subscriber = new OnDownloadRequested(dispatcher, downloadService)
        }
        return (this.subscriber as any).handle(event)
      }
    }
    const onDownloadRequested = new LazyDownloadSubscriber()
    
    onSendFileRequested.register()
    onSendNotifyRequestSubscriber.register()
    onDownloadRequested.register()

    return new TelegramListener(
      socket,
      {
        ensureTdLibInitialized,
        DownloadProgresStore: sharedProgress,
        CheckerSessionStore: checkerSessionStore,
        CheckerProfileRepository: checkerProfileRepository,
        PrismaRepositoryDownloads: downloadsRepository,
        dispatcher: dispatcher,
        archiveRepository,
        ReadArchives,
        handleChecker: handleSources,
        NotifyRepository: notifyRepository,
        NetflixRepository: netflixRepository,
      },
      settings,
    )
  }

  async handle() {
    console.log('Telegram Listener running')
    const bot = this.socket.bot
    const answerWating = await AnswerWatings.handle()
    const handleMessages = await HandleCommands.execute()

    bot.on('message', async (ctx: Context) => {
      const message = ctx.message
      if (!message) return

      const commandMessage =
        'text' in message ? message.text : undefined

      const chatId = ctx.chat?.id?.toString() ?? ctx.from?.id.toString() ?? ''
      const utils: ExecuteProps['utils'] = {
        jid: chatId,
        message: message,
        userName: ctx.from?.first_name ?? 'unknown',
        phone: '',
        restMessage: commandMessage?.trim().replace('  ', ' ').split(' ') ?? [],
      }

      const payload: ExecuteProps = {
        ctx: ctx,
        replys: {
          replyText: async (msg: string) => {
            if (!msg || msg.trim().length === 0) {
              msg = 'No data available.'
            }
            await ctx.reply(msg, {
              reply_parameters: { message_id: message.message_id },
            })
          },
          replyButton: async (data: ButtonsInterface) => {
            const keyboard = data.buttons.map((btn) => [
              { text: btn.buttonText.displayText, callback_data: btn.buttonId },
            ])
            await ctx.reply(data.text, {
              reply_parameters: { message_id: message.message_id },
              reply_markup: {
                inline_keyboard: keyboard,
              },
            })
          },
        },
        utils,
        dependencies: this.depencies,
        answerWating: answerWating,
      }

      const buttonReply = {
        id: 'data' in message && 'data' in message
          ? (message as any).data ?? null
          : null,
        text: 'data' in message && 'data' in message
          ? (message as any).data ?? null
          : null,
      }

      const answerPayload: ExecuteAnswerProps = {
        ...payload,
        utils: {
          ...payload.utils,
          buttonReply,
        },
      }

      const getCommand = commandMessage
        ?.trim()
        .split(' ')?.[0]
        .split(this.settings.prefix)?.[1]

      const existWatingAnswerToJid =
        answerWating.existWatingAnswerToJid(answerPayload)
      const command = handleMessages.commands.find(
        ({ name }) => name === getCommand,
      )

      if (existWatingAnswerToJid || command) {
        console.log(`[COMAND] -> ( ${getCommand} ) -> by: ${utils.userName} `)

        if (existWatingAnswerToJid)
          return await answerWating.execute(answerPayload)
        if (command) await command.execute(payload)
      }
    })

    bot.on('callback_query', async (ctx: Context) => {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return
      const data = ctx.callbackQuery.data
      if (!data) return

      const chatId = ctx.chat?.id?.toString() ?? ctx.from?.id.toString() ?? ''
      const utils: ExecuteProps['utils'] = {
        jid: chatId,
        message: ('message' in ctx.callbackQuery ? ctx.callbackQuery.message : undefined) as Context['message'],
        userName: ctx.from?.first_name ?? 'unknown',
        phone: '',
        restMessage: [],
      }

      const payload: ExecuteProps = {
        ctx: ctx,
        replys: {
          replyText: async (msg: string) => {
            if (!msg || msg.trim().length === 0) {
              msg = 'No data available.'
            }
            await ctx.reply(msg)
          },
          replyButton: async (btnData: ButtonsInterface) => {
            const keyboard = btnData.buttons.map((btn) => [
              { text: btn.buttonText.displayText, callback_data: btn.buttonId },
            ])
            await ctx.reply(btnData.text, {
              reply_markup: {
                inline_keyboard: keyboard,
              },
            })
          },
        },
        utils,
        dependencies: this.depencies,
        answerWating: answerWating,
      }

      const answerPayload: ExecuteAnswerProps = {
        ...payload,
        utils: {
          ...payload.utils,
          buttonReply: {
            id: data,
            text: data,
          },
        },
      }

      const existWatingAnswerToJid =
        answerWating.existWatingAnswerToJid(answerPayload)

      if (existWatingAnswerToJid) {
        console.log(`[ANSWER] -> callback_query -> by: ${utils.userName}`)
        await answerWating.execute(answerPayload)
      }

      await ctx.answerCbQuery()
    })
  }
}
