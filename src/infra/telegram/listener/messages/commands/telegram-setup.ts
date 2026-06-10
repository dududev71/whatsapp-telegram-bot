import type { Command, ExecuteProps } from '../repository/command'

export class CommandAdpter implements Command {
  name = 'start'

  async execute({ replys, utils }: ExecuteProps): Promise<void> {
    await replys.replyText(
      `Welcome ${utils.userName}! I'm your Telegram bot.\n\n` +
      `Available commands:\n` +
      `/d <link> - Download a file from Telegram\n` +
      `/status - View download progress\n` +
      `/stop - Cancel active download\n` +
      `/downloads - List saved downloads\n` +
      `/delete - Delete a download\n` +
      `/chk - Check archive integrity\n` +
      `/descompact - Extract archives\n` +
      `/netflix-code <code> - Login with Netflix code`,
    )
  }
}
