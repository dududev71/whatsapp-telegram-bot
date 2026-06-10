import type { Downloads } from '../../../../../generated/prisma/client'
import { right, type Either } from '../../../../core/either'
import type { DownloadsRepository } from '../../../shared/repositories/download-repository'

// interface FetchManyDownloadsInProgressServiceProps { }

export class FetchManyDownloadsDescompactService {
  constructor(private DonwloadsRepository: DownloadsRepository) { }
  async handle(): Promise<Either<null, Downloads[]>> {
    const fetch =
      await this.DonwloadsRepository.fetchManyDownloadsDescompact(0)
    return right(fetch)
  }
}
