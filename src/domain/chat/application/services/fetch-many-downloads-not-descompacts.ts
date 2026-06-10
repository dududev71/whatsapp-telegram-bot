import { right, type Either } from '../../../../core/either'
import type { DownloadsRepository } from '../../../shared/repositories/download-repository'
import type { Downloads } from '../../../../../generated/prisma/client'

// interface FetchManyDownloadsInProgressServiceProps { }

export class FetchManyDownloadsNotDescompactService {
  constructor(private DonwloadsRepository: DownloadsRepository) { }
  async handle(): Promise<Either<null, Downloads[]>> {
    const fetch =
      await this.DonwloadsRepository.fetchManyDownloadsNotDescompact(0)
    return right(fetch)
  }
}
