import type { MessageUpsertType, WAMessage } from '@itsukichan/baileys'
import type { Connection } from '../..'
import type { ArchivesRepository } from '../../../../domain/archives/repositories/arquives'
import type { HandleSourcesPort } from '../../../../domain/checker/repositories/handle-sources'
import type { ReadArchives } from '../../../../domain/checker/repositories/read-archive'
import { TelegramDownloadService } from '../../../../domain/donwload/aplication/services/telegram-download'
import { OnDownloadRequested } from '../../../../domain/donwload/aplication/subscribers/download'
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
import { NotifyWhatsappAdapter } from '../../../repositories/notify/notify-whatsapp'
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
  TelegramChatRepository: TelegramChatRepository
  TelegramDownloadRepository: TelegramDownloadRepository
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
export class Listener {
  private settings: Settings

  protected constructor(
    private socket: Connection,
    private depencies: depencies,
    settings?: Settings,
  ) {
    this.settings = {
      ...settings,
      prefix: '/',
      readHistory: false,
    }
  }
  static async start(socket: Connection, settings?: Settings) {
    const dispatcher = new EventDispatcher()
    const telegramChatRepository = await TelegramChatRepository.handle()
    const telegramDownloadRepository = await TelegramDownloadRepository.handle()

    const sharedProgress = new DownloadProgresStore()
    const checkerSessionStore = new CheckerSessionStore()
    const checkerProfileRepository = new PrismaRepositoryCheckerProfile()
    const downloadsRepository = new PrismaRepositoryDownloads()

    const archiveRepository = new ArchivesRepositoryAdapter()

    const downloadService = new TelegramDownloadService(
      telegramDownloadRepository,
      sharedProgress,
      downloadsRepository,
      dispatcher,
      archiveRepository,
    )
    const handleSources = await HandleSources.start()
    const ReadArchives = new ReadArchivesAdapter()
    const notifyRepository = new NotifyWhatsappAdapter(socket.WaSocket)
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
    const downloadSubscriber = new OnDownloadRequested(
      dispatcher,
      downloadService,
    )
    onSendFileRequested.register()
    onSendNotifyRequestSubscriber.register()
    downloadSubscriber.register()

    return new Listener(
      socket,
      {
        TelegramChatRepository: telegramChatRepository,
        TelegramDownloadRepository: telegramDownloadRepository,
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
    console.log('Listener running')
    const socket = this.socket.WaSocket
    const answerWating = await AnswerWatings.handle()
    const handleMessages = await HandleCommands.execute()

    socket.ev.on(
      'messages.upsert',
      async ({
        messages,
        type,
      }: {
        messages: WAMessage
        type: MessageUpsertType
      }) => {
        if (type !== 'notify' && !this.settings.readHistory) return

        const commandMessage =
          messages[0].message?.extendedTextMessage?.text ||
          messages[0].message?.conversation

        const utils: ExecuteProps['utils'] = {
          jid: messages[0].key.remoteJid as string,
          message: messages[0],
          userName: messages[0].pushName || 'unknow',
          phone: (messages[0].key.remoteJid as string).split('@')[0],
          restMessage: commandMessage?.trim().replace('  ', ' ').split(' '),
        }
        const payload: ExecuteProps = {
          socket: socket,
          replys: {
            replyText: async (msg: string) => {
              await socket.sendMessage(
                utils.jid as string,
                { text: msg },
                { quoted: utils.message },
              )
            },
            replyButton: async (data: ButtonsInterface) => {
              await socket.sendMessage(utils.jid, data)
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
              id: messages[0].message?.buttonsResponseMessage?.selectedButtonId,
              text: messages[0].message?.buttonsResponseMessage
                ?.selectedDisplayText,
            },
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
      },
    )
  }
}
