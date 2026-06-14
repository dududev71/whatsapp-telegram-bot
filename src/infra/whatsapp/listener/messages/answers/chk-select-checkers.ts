import {
  checkerState,
  renderToggleScreen,
} from './chk-checker-selection.js'
import { getSavedCheckersCount } from './chk-response-mode.js'
import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'
import type { AnswerWating } from '../utils/answer-wating'

export class SelectCheckersHandler implements AnswerCommands {
  answerKey = 'chk-select-checkers'

  async execute(
    { replys, dependencies, utils, answerWating }: ExecuteAnswerProps,
    previousAnswer: AnswerWating,
  ): Promise<void> {
    const selection = utils.buttonReply.id || ''
    const jid = utils.jid

    // Check if selection is a file name (from initial /chk screen)
    // or a checker choice button (all_checkers, select_checkers, etc.)
    const isCheckerChoice = ['all_checkers', 'select_checkers', 'use_saved', 'sback'].includes(selection)

    let fileName: string

    if (isCheckerChoice) {
      const stored = JSON.parse(previousAnswer.stored?.buttonId as string)
      fileName = stored.selectedFile as string
    } else {
      // Selection is the file name itself
      fileName = selection
    }

    switch (selection) {
      case 'all_checkers': {
        const checkers = dependencies.handleChecker.listCheckers()
        const onlineCheckers = checkers.filter((c) => c.online)

        await dependencies.CheckerProfileRepository.upsert(jid, onlineCheckers.map((c) => c.name))

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

      case 'sback': {
        const checkers = dependencies.handleChecker.listCheckers()
        const onlineCheckers = checkers.filter((c) => c.online)
        const savedCount = await getSavedCheckersCount(dependencies, jid)

        this.showSelectionScreen(replys, answerWating, jid, fileName, onlineCheckers, savedCount)
        break
      }

      default: {
        // selection is a file name from the initial /chk screen
        const checkers = dependencies.handleChecker.listCheckers()
        const onlineCheckers = checkers.filter((c) => c.online)
        const savedCount = await getSavedCheckersCount(dependencies, jid)
        this.showSelectionScreen(replys, answerWating, jid, fileName, onlineCheckers, savedCount)
        break
      }
    }
  }

  private showSelectionScreen(
    replys: { replyButton: (data: any) => Promise<void> },
    answerWating: any,
    jid: string,
    fileName: string,
    onlineCheckers: Array<{ name: string }>,
    savedCount: number,
  ) {
    answerWating.SetAnswerWating({
      answerKey: 'chk-select-checkers',
      timeOut: 60 * 1000,
      toJid: jid,
      type: 'button',
      stored: {
        buttonId: JSON.stringify({ selectedFile: fileName }),
      },
    })

    return replys.replyButton({
      footer: `Select which checkers to use — ${savedCount} saved`,
      text: `File: ${fileName}`,
      buttons: [
        { buttonId: 'all_checkers', buttonText: { displayText: `All checkers (${onlineCheckers.length})` } },
        { buttonId: 'select_checkers', buttonText: { displayText: 'Select' } },
        { buttonId: 'use_saved', buttonText: { displayText: savedCount > 0 ? `Saved (${savedCount})` : 'Saved (0)' } },
      ],
    })
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
      footer: 'density of notifications received',
      buttons: [
        { buttonId: 'anxiety', buttonText: { displayText: 'anxiety' } },
        { buttonId: 'time', buttonText: { displayText: 'time' } },
        { buttonId: 'silent', buttonText: { displayText: 'silent' } },
      ],
    })
  }
}
