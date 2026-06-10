export type CheckerResponse = {
  cookies: string
  report: string
  checkerName: string
}

export type CheckerInfo = {
  name: string
  keyWord: string
  online: boolean
}

export interface HandleSourcesPort {
  execute(content: string, selectedCheckers?: string[]): Promise<CheckerResponse[]>
  listCheckers(): CheckerInfo[]
}
