import type { CheckersState } from './chk-types.js'
import { getSavedCheckersCount } from './chk-response-mode.js'
import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'
import type { AnswerWating } from '../utils/answer-wating'

// Session state apenas para a tela de toggle (em memória, temporário)
export const checkerState: Map<string, CheckersState> = new Map()

// --- Detail toggle handler ---
export class DetailTogglesHandler implements AnswerCommands {
  answerKey = 'chk-detail-toggles'

  async execute(
    { replys, dependencies, utils, answerWating }: ExecuteAnswerProps,
    previousAnswer: AnswerWating,
  ): Promise<void> {
    const selection = utils.buttonReply.id || ''
    const jid = utils.jid
    const state = checkerState.get(jid)

    if (!state) {
      return await replys.replyText('Session expired. Run /chk again.')
    }

    const checkers = dependencies.handleChecker.listCheckers() as Array<{ name: string; online: boolean }>
    const onlineCheckers = checkers.filter((c) => c.online)

    // --- Back button ---
    if (selection === 'tback') {
      const savedCount = await getSavedCheckersCount(dependencies, jid)

      answerWating.SetAnswerWating({
        answerKey: 'chk-select-checkers',
        timeOut: 60 * 1000,
        toJid: jid,
        type: 'button',
        stored: {
          buttonId: JSON.stringify({ selectedFile: state.fileName }),
        },
      })

      await replys.replyButton({
        footer: `Select which checkers to use — ${savedCount} saved`,
        text: `File: ${state.fileName}`,
        buttons: [
          { buttonId: 'all_checkers', buttonText: { displayText: `All checkers (${onlineCheckers.length})` } },
          { buttonId: 'select_checkers', buttonText: { displayText: 'Select' } },
          { buttonId: 'use_saved', buttonText: { displayText: savedCount > 0 ? `Saved (${savedCount})` : 'Saved (0)' } },
        ],
      })
      return
    }

    // --- Toggle: t0, t1, t2... ---
    if (selection.startsWith('t') && selection.length > 1 && !selection.startsWith('tback') && !selection.startsWith('tuse')) {
      const suffix = selection.slice(1)
      const idx = Number(suffix)
      if (!isNaN(idx)) {
        const entries = Array.from(state.toggles.entries())
        if (idx >= 0 && idx < entries.length) {
          const [name, on] = entries[idx]
          state.toggles.set(name, !on)
        }
        await renderToggleScreen(replys, state, jid, answerWating)
        return
      }
    }

    // --- Use Selected ---
    if (selection === 'tuse') {
      const selected = Array.from(state.toggles.entries())
        .filter(([, on]) => on)
        .map(([name]) => name)

      if (selected.length === 0) {
        return await replys.replyText('No checkers selected.')
      }

      const alreadySaved = await dependencies.CheckerProfileRepository.findByJid(jid)
      if (!alreadySaved) {
        await dependencies.CheckerProfileRepository.upsert(jid, selected)
      }
      checkerState.delete(jid)

      // Go to mode screen instead of running directly
      answerWating.SetAnswerWating({
        answerKey: 'chk-response-mode',
        timeOut: 60 * 1000,
        toJid: jid,
        type: 'button',
        stored: {
          buttonId: JSON.stringify({ fileName: state.fileName, selectedCheckers: selected }),
        },
      })

      await replys.replyButton({
        text: 'Select Mode',
        footer: 'density of notifications received',
        buttons: [
          { buttonId: 'anxiety', buttonText: { displayText: 'anxiety' } },
          { buttonId: 'time', buttonText: { displayText: 'time' } },
          { buttonId: 'silent', buttonText: { displayText: 'silent' } },
        ],
      })
    }
  }
}

export function renderToggleScreen(
  replys: { replyButton: (data: any) => Promise<void> },
  state: CheckersState,
  jid: string,
  answerWating: any,
) {
  const toggleEntries = Array.from(state.toggles.entries())
  const buttons = toggleEntries.map(([name, on], i) => ({
    buttonId: `t${i}`,
    buttonText: {
      displayText: `[${on ? 'On' : 'Off'}] ${name}`,
    },
  }))

  buttons.push({
    buttonId: 'tback',
    buttonText: {
      displayText: 'Back',
    },
  })

  const selectedCount = Array.from(state.toggles.values()).filter(Boolean).length
  buttons.push({
    buttonId: 'tuse',
    buttonText: {
      displayText: `Use Selected (${selectedCount})`,
    },
  })

  answerWating.SetAnswerWating({
    answerKey: 'chk-detail-toggles',
    timeOut: 60 * 1000,
    toJid: jid,
    type: 'button',
    stored: {
      buttonId: JSON.stringify({ fileName: state.fileName }),
    },
  })

  return replys.replyButton({
    footer: `${selectedCount} checkers selected — tap to toggle`,
    text: 'Select checkers to use:',
    buttons,
  })
}
