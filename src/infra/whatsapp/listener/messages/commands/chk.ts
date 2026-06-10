// import { aesEncrypWithIV } from '@itsukichan/baileys';
// import { readArchiveAndCheckerService } from '../../../../../domain/checker/aplication/services/read-archive-and-checker';
// import type { Command, ExecuteProps } from '../repository/command';

// export class CommandAdpter implements Command {
//   name = 'chk'

//   async execute({
//     replys,
//     dependencies,
//     answerWating,
//     utils,
//   }: ExecuteProps): Promise<void> {
//     const readArchiveStarted = new readArchiveAndCheckerService(dependencies.PrismaRepositoryDownloads, dependencies.ReadArchives,dependencies.handleChecker);
//     await replys.replyText('Checker started ');

//     const res = await readArchiveStarted.handle()
//     await replys.replyText()
//   }
// }

import { FetchManyDownloadsDescompactService } from '../../../../../domain/chat/application/services/fetch-many-donwloads-descompact'
import type { Command, ExecuteProps } from '../repository/command'

export class CommandAdpter implements Command {
  name = 'chk'

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
    if (res.isLeft()) return await replys.replyText('Commmand fail. try again')
    if (res.value.length === 0)
      return await replys.replyText('No downloads available.')

    answerWating.SetAnswerWating({
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
      buttons: res.value.map(({ fileName, cratedAt }) => {
        return {
          buttonId: fileName,
          buttonText: {
            displayText: `${fileName} (${cratedAt.toDateString()})`,
          },
        }
      }),
    })
  }
}
