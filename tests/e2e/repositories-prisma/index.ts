import type { Downloads, PrismaClient } from '../../../generated/prisma/client'
import type { DownloadsUncheckedCreateInput } from '../../../generated/prisma/models'
import type { Archive } from '../../../src/domain/archives/enterprise/entity/arquive'
import type { DownloadsRepository } from '../../../src/domain/shared/repositories/download-repository'

export class PrismaE2eRepositoryDownloads implements DownloadsRepository {
  constructor(private prisma: PrismaClient) {}
  fetchManyDownloadsDescompact(page: number): Promise<Downloads[]> {
    throw new Error('Method not implemented.')
  }
  fetchManyDownloadsNotDescompact(page: number): Promise<Downloads[]> {
    throw new Error('Method not implemented.')
  }
  updateAfterExtract(
    { fileName, localFile }: Archive,
    lastFileName: string,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  async fetchManyDownloads(_page: number) {
    const fetchDownloads = await this.prisma.downloads.findMany()
    return fetchDownloads
  }
  async insertDownload(data: DownloadsUncheckedCreateInput) {
    const res = await this.prisma.$queryRawUnsafe('SHOW search_path')
    await this.prisma.downloads.create({
      data,
    })
  }
  async findByFileName(fileName: string): Promise<Downloads | null> {
    const response = this.prisma.downloads.findUnique({
      where: {
        fileName,
      },
    })
    return response
  }
}
