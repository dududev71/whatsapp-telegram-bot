export type CheckerSelectionState = {
  jid: string
  fileName: string
  mode: 'silent' | 'time' | 'anxiety'
  selectedCheckers: string[]  // empty = all checkers
}

export class CheckerSelectionStore {
  private selections: Map<string, CheckerSelectionState> = new Map()

  setState(
    jid: string,
    fileName: string,
    mode: 'silent' | 'time' | 'anxiety',
    selectedCheckers: string[],
  ): void {
    this.selections.set(jid, {
      jid,
      fileName,
      mode,
      selectedCheckers,
    })
  }

  getState(jid: string): CheckerSelectionState | undefined {
    return this.selections.get(jid)
  }

  deleteState(jid: string): void {
    this.selections.delete(jid)
  }
}
