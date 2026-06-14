// import { FetchManyDownloadsDescompactService } from '../../../../domain/chat/application/services/fetch-many-donwloads-descompact'
import { FetchManyDownloadsDescompactService } from '../../../../../domain/chat/application/services/fetch-many-donwloads-descompact'
import type { Command, ExecuteProps } from '../repository/command'

export class CommandAdpter implements Command {
  public name = 'chk'

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
    if (res.isLeft()) return await replys.replyText('Command fail. try again')
    const validDownloads = res.value.filter((item) => item.fileName)
    if (validDownloads.length === 0)
      return await replys.replyText('No downloads available.')

    await answerWating.SetAnswerWating({
      answerKey: 'chk-select-checkers',
      timeOut: 60 * 1000,
      toJid: utils.jid,
      type: 'button',
      stored: {
        buttonId: JSON.stringify({}),
      },
    })

    await replys.replyButton({
      footer: 'Available Downloads to checker',
      text: 'Select a file:',
      buttons: validDownloads.map((item) => ({
        buttonId: item.fileName,
        buttonText: {
          displayText: `${item.fileName} (${item.cratedAt.toDateString()})`,
        },
      })),
    })
  }
}
