export type CheckerProfile = {
  jid: string
  checkers: string[]
}

export interface CheckerProfileRepository {
  findByJid(jid: string): Promise<CheckerProfile | null>
  upsert(jid: string, checkers: string[]): Promise<void>
}
