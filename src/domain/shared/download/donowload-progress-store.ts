import type { UniqueEntityId } from '../../../core/entities/uniqueEntityId'

export interface DownloadInProgressInterface {
  downloadId: UniqueEntityId
  fileName: string
  porcent: number
  fileSize: number
}

export class DownloadProgresStore {
  private downloadInProgress: DownloadInProgressInterface[] = []

  async getDownloads() {
    return this.downloadInProgress
  }

  createDonwloadProgress(download: DownloadInProgressInterface) {
    this.downloadInProgress.push(download)
  }
  clearDownloadById(downloadIdParam: string) {
    const findIndexDownloads = this.downloadInProgress.findIndex(
      ({ downloadId }) => downloadId.toString === downloadIdParam,
    )
    if (findIndexDownloads >= 0)
      this.downloadInProgress.splice(findIndexDownloads, 1)
  }

  setPorcent(downloadIdParam: string, currentPorcent: number) {
    const index = this.downloadInProgress.findIndex(
      ({ downloadId }) => downloadId.toString === downloadIdParam,
    )
    if (index >= 0) {
      this.downloadInProgress[index] = {
        ...this.downloadInProgress[index],
        porcent: currentPorcent,
      }
    }
  }
}
