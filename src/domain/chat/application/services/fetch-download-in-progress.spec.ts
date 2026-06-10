import { beforeEach, describe, expect, it } from "vitest";

import { FetchManyDownloadsInProgressService } from "./fetch-donwload-in-progress";
import { DownloadProgresStore } from "../../../shared/download/donowload-progress-store";
import { UniqueEntityId } from "../../../../core/entities/uniqueEntityId";

let donwloadRepositorys: DownloadProgresStore;
let sut: FetchManyDownloadsInProgressService;

describe("fetch many downloads in progress", () => {
  beforeEach(async () => {
    donwloadRepositorys = new DownloadProgresStore();
    sut = new FetchManyDownloadsInProgressService(donwloadRepositorys);
  });

  it("should be abble started download", async () => {
    const id = new UniqueEntityId();
    donwloadRepositorys.createDonwloadProgress({
      fileName: " asdas",
      downloadId: id,
      porcent: 0,
    });
    const fetchs = await sut.handle();
    expect(fetchs.isRight()).toEqual(true);
    expect(fetchs.value).toHaveLength(1);
  }, 15000);
});
