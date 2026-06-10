export class CheckerSessionStore {
  private activeSessions: Map<string, { type: 'checker' | 'download'; controller: AbortController }> = new Map()

  startChecker(jid: string): AbortSignal {
    const controller = new AbortController()
    this.activeSessions.set(jid, { type: 'checker', controller })
    controller.signal.addEventListener('abort', () => {
      this.activeSessions.delete(jid)
    })
    return controller.signal
  }

  startDownload(jid: string): AbortSignal {
    const controller = new AbortController()
    this.activeSessions.set(jid, { type: 'download', controller })
    controller.signal.addEventListener('abort', () => {
      this.activeSessions.delete(jid)
    })
    return controller.signal
  }

  abort(jid: string): { success: boolean; type: 'checker' | 'download' | null } {
    const session = this.activeSessions.get(jid)
    if (!session) return { success: false, type: null }
    const type = session.type
    session.controller.abort()
    return { success: true, type }
  }

  isRunning(jid: string): boolean {
    return this.activeSessions.has(jid)
  }
}
