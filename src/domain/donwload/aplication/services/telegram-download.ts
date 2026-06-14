import { existsSync, mkdirSync } from 'node:fs'
import { join, parse } from 'node:path'
import { right, type Either } from '../../../../core/either'
import type { EventDispatcher } from '../../../../events'
import type { DownloadRequestedEvent } from '../../../../events/download-request-event'
import { NewNotifyEvent } from '../../../../events/send-notify-event'
import { Archive } from '../../../chat/archives/enterprise/entity/arquive'
import type { ArchivesRepository } from '../../../chat/archives/repositories/arquives'
import type {
  DownloadInProgressInterface,
  DownloadProgresStore,
} from '../../../shared/download/donowload-progress-store'
import type { DownloadsRepository } from '../../../shared/repositories/download-repository'
import type { DownloadError } from '../../errors/download-error'
import type { TelegramRepositoryDownload } from '../../repositories/telegram-repository'

type TelegramDownloadServiceProps = DownloadInProgressInterface &
  DownloadRequestedEvent['payload']

export class TelegramDownloadService {
  constructor(
    private TelegramRepository: TelegramRepositoryDownload,
    private sharedEvents: DownloadProgresStore,
    private DownloadsRepository: DownloadsRepository,
    private dispatcher: EventDispatcher,
    private archiveRepository: ArchivesRepository,
  ) {}

  async handle({
    downloadId,
    ownerPhone,
    OwnerUserName,
    fileName,
    jid,
    uri,
    fileSize,
    signal,
  }: TelegramDownloadServiceProps): Promise<
    Either<DownloadError | Error, null>
  > {
    const DownloadPath = join(process.cwd(), 'downloads')
    if (!existsSync(DownloadPath)) mkdirSync(DownloadPath)
    const logPath = join(DownloadPath, fileName)

    this.sharedEvents.createDonwloadProgress({
      downloadId: downloadId,
      fileName: fileName,
      porcent: 0,
      fileSize,
    })
    try {
      await this.TelegramRepository.downloadFromUri(
        {
          outputFile: logPath,
          uri,
        },
        (percent: number) => {
          this.sharedEvents.setPorcent(downloadId.toString, percent)
        },
        signal,
      )
    } catch (err: any) {
      if (
        err.message === 'Download stopped' ||
        err.message === 'Download stopped before start'
      ) {
        this.sharedEvents.clearDownloadById(downloadId.toString)
        return right(null)
      }
      throw err
    }

    this.sharedEvents.clearDownloadById(downloadId.toString)
    const isCompact = parse(fileName).ext !== '.txt'

    await this.DownloadsRepository.insertDownload({
      localFile: logPath,
      isCompact,
      fileName,
      OwnerUserName,
      ownerPhone: ownerPhone ?? null,
    })

    if (isCompact && this.archiveRepository.isValidPath(logPath)) {
      await this.dispatcher.dispatch(
        new NewNotifyEvent({
          content: `Download finished: ${fileName}. Extracting...`,
          jidRecipient: jid,
        }),
      )
      const archive = new Archive({ localFile: logPath, fileName })
      const extractResult = await this.archiveRepository.descompact(archive)

      if (extractResult.isRight()) {
        const extractedPath = extractResult.value
        const extractedName = parse(extractedPath).name
        await this.DownloadsRepository.updateAfterExtract(
          {
            localFile: extractedPath,
            fileName: extractedName,
            password: null,
          } as Archive,
          fileName,
        )
        await this.dispatcher.dispatch(
          new NewNotifyEvent({
            content: `Finished download and extraction: ${extractedName}. Use /chk to check it.`,
            jidRecipient: jid,
          }),
        )
        return right(null)
      } else {
        const { value: errorMessage } = extractResult
        await this.dispatcher.dispatch(
          new NewNotifyEvent({
            content: `Could not extract archive. Error: ${errorMessage}. Use /descompact to try manually.`,
            jidRecipient: jid,
          }),
        )
        return right(null)
      }
    }

    await this.dispatcher.dispatch(
      new NewNotifyEvent({
        content:
          'Finished download. Use /chk to check it, or /downloads to view all downloads.',
        jidRecipient: jid,
      }),
    )
    return right(null)
  }
}
