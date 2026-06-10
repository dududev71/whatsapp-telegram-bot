export interface ReadArchives {
  readArchive(localArchive: string) : AsyncGenerator<string>
}
