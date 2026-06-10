import type { Either } from '../../../core/either'
import type { ReportForCompact } from '../../shared/arquives/interfaces/compact'
import type { Archive } from '../enterprise/entity/arquive'

export interface ArchivesRepository {
  descompact(data: Archive): Promise<Either<string, string>>
  isValidPath(localFile: string): boolean
  compact(report: ReportForCompact): Promise<Buffer>
}
