import { FetchManyDownloadsDescompactService } from '../../../../../domain/chat/application/services/fetch-many-donwloads-descompact'
import type { Command, ExecuteProps } from '../repository/command'

export class CommandAdpter implements Command {
  name = 'delete'

  async execute({
    replys,
    dependencies,
    answerWating,
    utils,
  }: ExecuteProps): Promise<void> {
    const getManyDownloadsDescompacts = new FetchManyDownloadsDescompactService(
      dependencies.PrismaRepositoryDownloads,
    )
    const res = await getManyDownloadsDescompacts.handle()
    if (res.isLeft()) return await replys.replyText('Command failed. try again')
    if (res.value.length === 0)
      return await replys.replyText('No downloads available.')

    answerWating.SetAnswerWating({
      answerKey: 'delete-response',
      timeOut: 60 * 1000,
      toJid: utils.jid,
      type: 'button',
    })

    await replys.replyButton({
      footer: 'Select a download to delete',
      text: 'Downloads',
      buttons: res.value.map(({ fileName, cratedAt }) => {
        return {
          buttonId: fileName,
          buttonText: {
            displayText: ` ${fileName} (${cratedAt.toDateString()}) `,
          },
        }
      }),
    })
  }
}
