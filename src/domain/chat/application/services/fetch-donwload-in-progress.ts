import { right, type Either } from "../../../../core/either";
import type {
  DownloadInProgressInterface,
  DownloadProgresStore,
} from "../../../shared/download/donowload-progress-store";

// interface FetchManyDownloadsInProgressServiceProps { }

export class FetchManyDownloadsInProgressService {
  constructor(private donwloadProgress: DownloadProgresStore) {}
  async handle(): Promise<Either<null, DownloadInProgressInterface[]>> {
    const fetch = await this.donwloadProgress.getDownloads();
    return right(fetch);
  }
}
