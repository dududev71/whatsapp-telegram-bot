export interface readDataUriProps {
  uri: string
  outputFile: string
}

export interface TelegramRepositoryDownload {
  downloadFromUri(
    data: readDataUriProps,
    callback?: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<void>
}
