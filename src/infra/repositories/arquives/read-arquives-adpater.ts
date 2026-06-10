import { readdirSync, readFileSync, statSync } from "fs";
import { ReadArchives } from "../../../domain/checker/repositories/read-archive";

export class ReadArchivesAdapter implements ReadArchives {

  private redirDirectorys(path: string) {
    const itemns = readdirSync(path);

      const filtersDirectorys = itemns.filter((item) =>
        !statSync(path + "/" + item).isFile() ? item : null
      );
      const filtersFiles = itemns.filter((item) =>
        statSync(path + "/" + item).isFile() && item.includes(".txt")
          ? item
          : null
      );
      return [filtersDirectorys, filtersFiles];

  }
    private async *loopDfs(currentPath:string): AsyncGenerator<string> {
      const [directorys, files] = this.redirDirectorys(currentPath);

      for (const file of files) {
        yield `${currentPath}/${file}`;
      }

        for (const index of directorys) {
          yield* this.loopDfs(currentPath + "/" + index );
      }
    }
    async *readArchive(localArchive: string): AsyncGenerator<string> {
        for await (const file of this.loopDfs(localArchive)) {
          try {
            const content = readFileSync(file, 'utf-8')
            yield content
          } catch {}
        }
    }

}
