import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'
import type { AnswerWating } from '../utils/answer-wating'

export type CheckersState = { fileName: string; toggles: Map<string, boolean> }

export const checkerState: Map<string, CheckersState> = new Map()

export class CommandAdpter implements AnswerCommands {
  answerKey = 'chk-select-checkers'

  async execute(
    { replys, dependencies, utils, answerWating }: ExecuteAnswerProps,
    previousAnswer: AnswerWating,
  ): Promise<void> {
    const selection = utils.buttonReply.id || ''
    const jid = utils.jid

    const isCheckerChoice = ['all_checkers', 'select_checkers', 'use_saved', 'back'].includes(selection)

    let fileName: string

    if (isCheckerChoice) {
      const stored = JSON.parse(previousAnswer.stored?.buttonId || '{}')
      fileName = stored.selectedFile || ''
    } else {
      fileName = selection
    }

    switch (selection) {
      case 'all_checkers': {
        const checkers = dependencies.handleChecker.listCheckers()
        const onlineCheckers = checkers.filter((c) => c.online)

        const alreadySaved = await dependencies.CheckerProfileRepository.findByJid(jid)
        if (!alreadySaved) {
          await dependencies.CheckerProfileRepository.upsert(jid, onlineCheckers.map((c) => c.name))
        }

        this.goToModeScreen(replys, answerWating, jid, fileName, undefined)
        break
      }

      case 'select_checkers': {
        const checkers = dependencies.handleChecker.listCheckers()
        const onlineCheckers = checkers.filter((c) => c.online)

        checkerState.set(jid, {
          fileName,
          toggles: new Map(onlineCheckers.map((c) => [c.name, true])),
        })

        renderToggleScreen(replys, checkerState.get(jid)!, jid, answerWating)
        break
      }

      case 'use_saved': {
        const saved = await dependencies.CheckerProfileRepository.findByJid(jid)
        if (saved && saved.checkers.length > 0) {
          this.goToModeScreen(replys, answerWating, jid, fileName, saved.checkers)
        } else {
          await replys.replyText('No saved selection. Use "Select" to create one.')
        }
        break
      }

      case 'back': {
        await replys.replyText('Going back to file selection...')
        break
      }

      default: {
        const checkers = dependencies.handleChecker.listCheckers()
        const onlineCheckers = checkers.filter((c) => c.online)

        answerWating.SetAnswerWating({
          answerKey: 'chk-select-checkers',
          timeOut: 60 * 1000,
          toJid: jid,
          type: 'button',
          stored: {
            buttonId: JSON.stringify({ selectedFile: fileName }),
          },
        })

        await replys.replyButton({
          footer: 'Select which checkers to use',
          text: `File: ${fileName}`,
          buttons: [
            { buttonId: 'all_checkers', buttonText: { displayText: `All checkers (${onlineCheckers.length})` } },
            { buttonId: 'select_checkers', buttonText: { displayText: 'Select' } },
            { buttonId: 'use_saved', buttonText: { displayText: 'Use saved' } },
          ],
        })
        break
      }
    }
  }

  private goToModeScreen(
    replys: { replyButton: (data: any) => Promise<void> },
    answerWating: any,
    jid: string,
    fileName: string,
    selectedCheckers: string[] | undefined,
  ) {
    answerWating.SetAnswerWating({
      answerKey: 'chk-response-mode',
      timeOut: 60 * 1000,
      toJid: jid,
      type: 'button',
      stored: {
        buttonId: JSON.stringify({ fileName, selectedCheckers }),
      },
    })

    return replys.replyButton({
      text: 'Select Mode',
      footer: 'Density of notifications received',
      buttons: [
        { buttonId: 'anxiety', buttonText: { displayText: 'Anxiety' } },
        { buttonId: 'time', buttonText: { displayText: 'Time' } },
        { buttonId: 'silent', buttonText: { displayText: 'Silent' } },
      ],
    })
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
