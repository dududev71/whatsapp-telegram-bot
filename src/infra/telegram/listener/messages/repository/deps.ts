// src/infra/telegram/listener/messages/repository/deps.ts
import type { ArchivesRepository } from '../../../../../domain/chat/archives/repositories/arquives'
import type { NetflixCookies } from '../../../../../domain/chat/repositories/netflix'
import type { HandleSourcesPort } from '../../../../../domain/checker/repositories/handle-sources'
import type { ReadArchives } from '../../../../../domain/checker/repositories/read-archive'
import type { TelegramDownloadService } from '../../../../../domain/donwload/aplication/services/telegram-download'
import type { NotifyRepositoryPort } from '../../../../../domain/notify/repositories/notify'
import type { CheckerSessionStore } from '../../../../../domain/shared/checker/checker-session-store'
import type { DownloadProgresStore } from '../../../../../domain/shared/download/donowload-progress-store'
import type { CheckerProfileRepository } from '../../../../../domain/shared/repositories/checker-profile'
import type { EventDispatcher } from '../../../../../events'
import type { PrismaRepositoryDownloads } from '../../../../repositories/prisma/prisma-repository-downloads'
import type { TelegramChatRepository } from '../../../../repositories/telegram/chat-repository'

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
