import { LoginTvService } from '../../../../../domain/chat/application/services/login-netflix'
import type { Command, ExecuteProps } from '../repository/command'

export class CommandAdpter implements Command {
  name = 'netflix-code'

  async execute({ replys, dependencies, utils }: ExecuteProps): Promise<void> {
    const code = utils.restMessage?.[1]?.replaceAll(/[^0-9]/g, '')
    if (code?.length !== 8) {
      return await replys.replyText('Invalid code, use /netflix-code <code>')
    }

    const vsfdcanceidecoda = new LoginTvService(
      dependencies.PrismaRepositoryDownloads,
      dependencies.NetflixRepository,
    )
    const res = await vsfdcanceidecoda.handle({
      code: code,
    })

    // if (res.isRight()) {
    return await replys.replyText(res.value)
    // }
  }
}
