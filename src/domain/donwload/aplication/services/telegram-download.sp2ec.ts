import { beforeAll, beforeEach, describe, it } from 'vitest'
import { TelegramDownloadRepositoryTests } from '../../../../../tests/repositories/download/telegram-repository'
import { TelegramDownloadService } from '../../../donwload/aplication/services/telegram-download'
import { DownloadProgresStore } from '../../../shared/download/donowload-progress-store'
import type { DownloadsRepository } from '../../../shared/repositories/download-repository'
import type { TelegramRepositoryDownload } from '../../repositories/telegram-repository'
import type { ArchivesRepository } from '../../../archives/repositories/arquives'

const fakeArchiveRepository = {
  isValidPath: () => false,
} as unknown as ArchivesRepository

const fakeDownloadsRepository = {
  insertDownload: async () => {},
} as unknown as DownloadsRepository

let telegramRepository: TelegramRepositoryDownload
let dispatcher: DownloadProgresStore
let _sut: TelegramDownloadService

describe('test telegram start donwload (subdomain start)', () => {
  beforeEach(async () => {})

  beforeAll(async () => {
    dispatcher = new DownloadProgresStore()
    telegramRepository = await TelegramDownloadRepositoryTests.handle()
    _sut = new TelegramDownloadService(
      telegramRepository,
      dispatcher,
      fakeDownloadsRepository,
      {} as any,
      fakeArchiveRepository,
    )
  })
  it('should be abble started download', async () => {
    // const download = await sut.handle({
    // });
    // await new Promise((r) =>
    //   setTimeout(() => {
    //     r(1);
    //   }, 4000),
    // );
    // expect(download.isRight()).toEqual(true);
  }, 15000)
})
