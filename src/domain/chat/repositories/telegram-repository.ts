// telegram-repository.ts
export interface TelegramRepositoryChatProps {
  uri: string
}

export interface TelegramMessageData {
  id: number
  fileName: string | null
  hasDocument: boolean
  fileSize: number
  raw: any // guarda o objeto original para o download
}

export interface TelegramRepositoryChat {
  readDataUri(props: TelegramRepositoryChatProps): Promise<TelegramMessageData>
}
