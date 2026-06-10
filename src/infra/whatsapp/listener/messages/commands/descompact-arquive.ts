import { FetchManyDownloadsNotDescompactService } from '../../../../../domain/chat/application/services/fetch-many-downloads-not-descompacts'
import type { Command, ExecuteProps } from '../repository/command'

export class CommandAdpter implements Command {
  name = 'descompact'

  async execute({
    replys,
    dependencies,
    answerWating,
    utils,
  }: ExecuteProps): Promise<void> {
    const getManyDownloadsDescompacts =
      new FetchManyDownloadsNotDescompactService(
        dependencies.PrismaRepositoryDownloads,
      )
    const res = await getManyDownloadsDescompacts.handle()
    if (res.isLeft()) return await replys.replyText('Commmand fail. try again')

    answerWating.SetAnswerWating({
      answerKey: 'descompact-response',
      timeOut: 60 * 1000,
      toJid: utils.jid,
      type: 'button',
    })
    await replys.replyButton({
      footer: 'Descompact Files',
      text: 'Files',
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

// openclaude--
// resume
// adea5adb-d43c-4388-a5a2-6f8baf71ed4c
