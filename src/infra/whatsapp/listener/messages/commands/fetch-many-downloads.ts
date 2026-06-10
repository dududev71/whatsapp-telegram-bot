import { FetchManyDownloadsService } from '../../../../../domain/chat/application/services/fetch-many-downloads'
import type { Command, ExecuteProps } from '../repository/command'

export class CommandAdpter implements Command {
  name = 'downloads'

  async execute({ replys, dependencies }: ExecuteProps): Promise<void> {
    const startDownload = new FetchManyDownloadsService(
      dependencies.PrismaRepositoryDownloads,
    )
    const res = await startDownload.handle()
    if (res.isLeft()) return await replys.replyText('Commmand fail. try again')

    // const formater = res.value.map(({ fileName, cratedAt }, index) => {
    //   return ` ${index} -> ${fileName} (${cratedAt.toDateString()}) `;
    // });
    if (res.value.length === 0) return await replys.replyText('No downloads.')
    await replys.replyButton({
      footer: 'Saved Downloads',
      text: 'Downloads',
      buttons: res.value.map(({ fileName, cratedAt }, index) => {
        return {
          buttonId: index.toString(),
          buttonText: {
            displayText: ` ${fileName} (${cratedAt.toDateString()}) `,
          },
        }
      }),
    })
  }
}
