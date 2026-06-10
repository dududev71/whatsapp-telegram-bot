import type {
  CookieReport,
  Downloads,
} from '../../../../generated/prisma/client'
import type { DownloadsUncheckedCreateInput } from '../../../../generated/prisma/models'
import type { Archive } from '../../../domain/archives/enterprise/entity/arquive'
import type { ReportForCompact } from '../../../domain/shared/arquives/interfaces/compact'
import type { DownloadsRepository } from '../../../domain/shared/repositories/download-repository'
import { prisma } from '../../../lib/prisma'

export class PrismaRepositoryDownloads implements DownloadsRepository {
  async getCookie(checkerName: string): Promise<CookieReport | null> {
    return await prisma.cookieReport.findFirst()
  }
  async updateAfterExtract(
    { fileName, localFile }: Archive,
    lastFileName: string,
  ): Promise<void> {
    await prisma.downloads.update({
      where: {
        fileName: lastFileName,
      },
      data: {
        fileName,
        localFile,
        isCompact: false,
      },
    })
  }
  async deleteCookie(cookieId: string): Promise<void> {
    await prisma.cookieReport.delete({
      where: {
        id: cookieId,
      },
    })
  }
  async fetchManyDownloadsDescompact(page: number): Promise<Downloads[]> {
    const fetchDownloads = await prisma.downloads.findMany({
      where: {
        isCompact: false,
      },
    })
    return fetchDownloads
  }

  async fetchManyDownloads(_page: number) {
    const fetchDownloads = await prisma.downloads.findMany()
    return fetchDownloads
  }
  async fetchManyDownloadsNotDescompact(_page: number): Promise<Downloads[]> {
    const fetchDownloads = await prisma.downloads.findMany({
      where: {
        isCompact: true,
      },
    })
    return fetchDownloads
  }
  async insertDownload(data: DownloadsUncheckedCreateInput) {
    await prisma.downloads.create({
      data: data,
    })
  }

  async findByFileName(fileName: string): Promise<Downloads | null> {
    const res = await prisma.downloads.findUnique({
      where: {
        fileName: fileName,
      },
    })

    return res
  }

  async deleteByFileName(fileName: string): Promise<void> {
    await prisma.downloads.delete({
      where: {
        fileName,
      },
    })
  }

  async saveCookieReports(
    fileName: string,
    reports: ReportForCompact,
  ): Promise<void> {
    // First, find the download by fileName
    const download = await prisma.downloads.findUnique({
      where: {
        fileName: fileName,
      },
    })

    if (!download) {
      throw new Error(`Download not found for fileName: ${fileName}`)
    }

    // Delete existing cookie reports for this download
    await prisma.cookieReport.deleteMany({
      where: {
        downloadId: download.id,
      },
    })

    // Prepare data for insertion
    const cookieReportsData = []
    for (const [checkerName, entries] of Object.entries(reports)) {
      for (const entry of entries) {
        cookieReportsData.push({
          downloadId: download.id,
          checkerName,
          cookie: entry.cookie,
          report: entry.report,
        })
      }
    }

    // Insert new cookie reports
    if (cookieReportsData.length > 0) {
      await prisma.cookieReport.createMany({
        data: cookieReportsData,
      })
    }
  }

  async getCookieReports(fileName: string): Promise<ReportForCompact> {
    // Find the download by fileName
    const download = await prisma.downloads.findUnique({
      where: {
        fileName: fileName,
      },
    })

    if (!download) {
      return {} // Return empty object if download not found
    }

    // Fetch cookie reports for this download
    const cookieReports = await prisma.cookieReport.findMany({
      where: {
        downloadId: download.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Transform to ReportForCompact format
    const result: ReportForCompact = {}
    for (const report of cookieReports) {
      if (!result[report.checkerName]) {
        result[report.checkerName] = []
      }
      result[report.checkerName].push({
        name: report.checkerName,
        cookie: report.cookie,
        report: report.report,
      })
    }

    return result
  }
}
