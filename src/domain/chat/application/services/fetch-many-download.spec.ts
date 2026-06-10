import { beforeEach, describe, expect, it } from "vitest";

import { FetchManyDownloadsService } from "./fetch-many-downloads";
import { InMemoryDownloadsRepository } from "../../../../../tests/repositories/shared/in-memory-repository";

let donwloadRepositorys: InMemoryDownloadsRepository;
let sut: FetchManyDownloadsService;

describe("Fetch many downloads", () => {
  beforeEach(async () => {
    donwloadRepositorys = new InMemoryDownloadsRepository();
    sut = new FetchManyDownloadsService(donwloadRepositorys);
  });

  it("should be abble started download", async () => {
    donwloadRepositorys.insertDownload({
      localFile: "OnDownloadRequested",
      OwnerUserName: "OnDownloadRequested",
      checked: null,
      cratedAt: new Date(),
      fileName: " asdas",
      ownerPhone: "23",
      isCompact: true,
      id: "ads",
    });
    const fetchs = await sut.handle();
    expect(fetchs.isRight()).toEqual(true);
    expect(fetchs.value).toHaveLength(1);
  }, 15000);
});
