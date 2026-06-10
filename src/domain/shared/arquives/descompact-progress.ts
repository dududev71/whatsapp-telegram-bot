import type { UniqueEntityId } from '../../../core/entities/uniqueEntityId'

export interface descompactInProgressInterface {
  descompactId: UniqueEntityId
  fileName: string
  porcent: number
}

export class descompactProgresShared {
  private descompactInProgress: descompactInProgressInterface[] = []

  async getdescompacts() {
    return this.descompactInProgress
  }

  createDonwloadProgress(descompact: descompactInProgressInterface) {
    this.descompactInProgress.push(descompact)
  }
  cleardescompactById(descompactIdParam: string) {
    const findIndexdescompacts = this.descompactInProgress.findIndex(
      ({ descompactId }) => descompactId.toString === descompactIdParam,
    )
    if (findIndexdescompacts >= 0)
      this.descompactInProgress.splice(findIndexdescompacts, 1)
  }

  setPorcent(descompactIdParam: string, currentPorcent: number) {
    const index = this.descompactInProgress.findIndex(
      ({ descompactId }) => descompactId.toString === descompactIdParam,
    )
    if (index >= 0) {
      this.descompactInProgress[index] = {
        ...this.descompactInProgress[index],
        porcent: currentPorcent,
      }
    }
  }
}
