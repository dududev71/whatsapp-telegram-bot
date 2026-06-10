import { left, right, type Either } from '../../../../core/either'
import type { DownloadsRepository } from '../../../shared/repositories/download-repository'
import type { NetflixCookies } from '../../repositories/netflix'

interface LoginTvServiceRequest {
  code: string
}

export class LoginTvService {
  constructor(
    private persistentRepository: DownloadsRepository,
    private NetflixCookies: NetflixCookies,
  ) {}

  async handle({
    code,
  }: LoginTvServiceRequest): Promise<Either<string, string>> {
    try {
      const cookie = await this.persistentRepository.getCookie('Netflix')
      if (!cookie) {
        throw new Error('No cookie found.')
      }
      console.log(cookie)
      const isValidCookie = await this.NetflixCookies.isValidCookie(
        cookie.cookie,
      )

      if (!isValidCookie) {
        // console.log(cookie.cookie)
        // console.log(cookie)
        // if (cookie.report.includes('[N/A] [N/A]')) {
        await this.persistentRepository.deleteCookie(cookie.id)
        // }
        throw new Error('Invalid cookie. try again.')
      }

      await this.NetflixCookies.LoginTv(code, cookie.cookie)
      await this.persistentRepository.deleteCookie(cookie.id)
      return right(cookie.report)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      return left(message)
    }
  }
}
