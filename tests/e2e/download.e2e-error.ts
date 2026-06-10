import { beforeAll, describe, expect, it } from 'vitest'
import { FetchManyDownloadsInProgressService } from '../../src/domain/chat/application/services/fetch-donwload-in-progress'
import { FetchManyDownloadsService } from '../../src/domain/chat/application/services/fetch-many-downloads'
import { startTelegramDownloadService } from '../../src/domain/chat/application/services/start-telegram-download'
import type { TelegramRepositoryChat } from '../../src/domain/chat/repositories/telegram-repository'
import { TelegramDownloadService } from '../../src/domain/donwload/aplication/services/telegram-download'
import { OnDownloadRequested } from '../../src/domain/donwload/aplication/subscribers/download'
import { DownloadProgresStore } from '../../src/domain/shared/download/donowload-progress-store'
import { EventDispatcher } from '../../src/events'
import { makePrismaClient } from '../factories/make-prisma-client'
import { TelegramChatRepositoryTest } from '../repositories/chat/telegram-repository'
import { TelegramDownloadRepositoryTests } from '../repositories/download/telegram-repository'
import { PrismaE2eRepositoryDownloads } from './repositories-prisma'

let telegramRepository: TelegramRepositoryChat
let dispatcher: EventDispatcher
let downloadsRepository: PrismaE2eRepositoryDownloads
let sharedProgress: DownloadProgresStore
let sut: startTelegramDownloadService

describe('test telegram start donwload (subdomain start)', () => {
  beforeAll(async () => {
    dispatcher = new EventDispatcher()
    telegramRepository = await TelegramChatRepositoryTest.handle()
    sut = new startTelegramDownloadService(telegramRepository, dispatcher)
    // repo do download
    const telegramRepo = await TelegramDownloadRepositoryTests.handle()

    //shared
    sharedProgress = new DownloadProgresStore()
    //prisma
    //
    const prisma = makePrismaClient()
    // dowloads repositories
    downloadsRepository = new PrismaE2eRepositoryDownloads(prisma)
    const schema = await prisma.$queryRawUnsafe(`SHOW search_path`)
    console.log('🔥 SEARCH_PATH:', schema)
    // service
    const downloadService = new TelegramDownloadService(
      telegramRepo,
      sharedProgress,
      downloadsRepository,
    )

    // subscriber
    const downloadSubscriber = new OnDownloadRequested(
      dispatcher,
      downloadService,
    )
    telegramRepository = await TelegramChatRepositoryTest.handle()
    sut = new startTelegramDownloadService(telegramRepository, dispatcher)
    downloadSubscriber.register()
  })
  it('should be abble finish download', async () => {
    const download = await sut.handle({
      uri: 'https://t.me/OBSERVERCLOUDULPNEW/1522',
      numberUserRequested: '98988156622',
      OwnerUserName: 'duduzzk71',
    })
    expect(download.isRight()).toEqual(true)

    await new Promise((r) => {
      setTimeout(() => {
        r(1)
      }, 2000)
    })
    const downlaodsInProgress = new FetchManyDownloadsInProgressService(
      sharedProgress,
    )

    const getProgress = await downlaodsInProgress.handle()
    expect(getProgress.value).toHaveLength(1)

    await new Promise((r) => {
      setTimeout(() => {
        r(1)
      }, 4000)
    })
    const getProgress2 = await downlaodsInProgress.handle()
    expect(getProgress.value).toHaveLength(0)

    const getDownloads = new FetchManyDownloadsService(downloadsRepository)
    const allDownloads = await getDownloads.handle()
    expect(allDownloads.value).toHaveLength(1)
  }, 15000)
})
