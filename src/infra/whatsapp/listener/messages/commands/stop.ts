import type { Command, ExecuteProps } from '../repository/command'

export class CommandAdpter implements Command {
  name = 'stop'

  async execute({
    replys,
    dependencies,
    utils,
  }: ExecuteProps): Promise<void> {
    const { success, type } = dependencies.CheckerSessionStore.abort(utils.jid)

    if (!success) {
      return await replys.replyText('No active download or checker to stop.')
    }

    const label = type === 'download' ? 'download' : 'checker'
    await replys.replyText(`${label.charAt(0).toUpperCase() + label.slice(1)} stopped.`)
  }
}
