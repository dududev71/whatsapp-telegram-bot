import type { Downloads } from '../../../generated/prisma/client'
import type { Archive } from '../../../src/domain/archive/enterprise/entity/arquive'
import type { DownloadsRepository } from '../../../src/domain/shared/repositories/download-repository'

export class InMemoryDownloadsRepository implements DownloadsRepository {
  public items: Downloads[] = []
  async fetchManyDownloads(_page: number): Promise<Downloads[]> {
    return this.items
  }
  async insertDownload(data: Downloads): Promise<void> {
    this.items.push(data)
  }
  async findByFileName(fileNameProps: string): Promise<Downloads | null> {
    return this.items.find(({ fileName }) => fileName === fileNameProps) || null
  }
  async fetchManyDownloadsNotDescompact(_page: number): Promise<Downloads[]> {
    return this.items
  }
  async updateIsCompact(data: Archive): Promise<void> {
    const getItem = this.items.findIndex(
      ({ fileName }) => fileName === data.fileName,
    )
    this.items[getItem] = {
      ...this.items[getItem],
      isCompact: false,
    }
  }
}
