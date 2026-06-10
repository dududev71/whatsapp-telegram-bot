import { parse as PathParse } from 'node:path'
import { left, right, type Either } from '../../../../core/either'
import type { DownloadsRepository } from '../../../shared/repositories/download-repository'
import { Archive } from '../../enterprise/entity/arquive'
import type { ArchivesRepository } from '../../repositories/arquives'
export type DescompactArchiveServiceRequest = {
  password?: string
  fileName: string
}
export class DescompactArchiveService {
  constructor(
    private archiveRepository: ArchivesRepository,
    // private descompactProgress: descompactProgresShared,
    private downloadsSaved: DownloadsRepository,
  ) {}
  async handle({
    password,
    fileName,
  }: DescompactArchiveServiceRequest): Promise<Either<string, string>> {
    const dataFIle = await this.downloadsSaved.findByFileName(fileName)
    if (!dataFIle) return left('File does not exist')
    if (!this.archiveRepository.isValidPath(dataFIle.localFile))
      return left('File does not exist in storage.')

    const arquiveEntity = new Archive({
      fileName,
      password: password ?? null,
      localFile: dataFIle.localFile,
    })
    const res = await this.archiveRepository.descompact(arquiveEntity)
    const { value } = res
    if (res.isRight()) {
      arquiveEntity.localFile = value
      arquiveEntity.fileName = PathParse(value).name;
      await this.downloadsSaved.updateAfterExtract(arquiveEntity, dataFIle.fileName)
      return right('descompact successfull.')
    } else {
      return left(`descompact fail. reason : ${value}`)
    }
  }
}
