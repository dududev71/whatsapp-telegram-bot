import type { EventDispatcher } from '../../../../../events'
import { NewFileReportEvent } from '../../../../../events/send-file-report'
import type { ReportForCompact } from '../../../../shared/arquives/interfaces/compact'
import type { ArchivesRepository } from '../../../repositories/arquives'

export class CompactArchiveService {
  constructor(
    private archiveRepository: ArchivesRepository,
    private dispather: EventDispatcher,
  ) {}
  async handle(data: ReportForCompact, jid: string): Promise<void> {
    const compact = await this.archiveRepository.compact(data)
    await this.dispather.dispatch(
      new NewFileReportEvent({
        content: 'Finaly Report.',
        fileContent: compact,
        jidRecipient: jid,
      }),
    )
  }
}
