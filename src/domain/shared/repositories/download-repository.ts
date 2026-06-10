import type {
  CookieReport,
  Downloads,
} from '../../../../generated/prisma/client'
import type { DownloadsUncheckedCreateInput } from '../../../../generated/prisma/models'
import type { Archive } from '../../archives/enterprise/entity/arquive'
import type { ReportForCompact } from '../arquives/interfaces/compact'

export interface DownloadsRepository {
  fetchManyDownloads(page: number): Promise<Downloads[]>
  fetchManyDownloadsDescompact(page: number): Promise<Downloads[]>
  fetchManyDownloadsNotDescompact(page: number): Promise<Downloads[]>
  insertDownload(data: DownloadsUncheckedCreateInput): Promise<void>
  findByFileName(fileName: string): Promise<Downloads | null>
  updateAfterExtract(
    { fileName, localFile }: Archive,
    lastFileName: string,
  ): Promise<void>
  deleteByFileName(fileName: string): Promise<void>
  saveCookieReports(fileName: string, reports: ReportForCompact): Promise<void>
  getCookieReports(fileName: string): Promise<ReportForCompact>
  getCookie(checkerName: string): Promise<CookieReport | null>
  deleteCookie(cookieId: string): Promise<void>
}
