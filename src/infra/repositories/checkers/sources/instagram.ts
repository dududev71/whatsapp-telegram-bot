import axios from 'axios'
import { left, right, type Either } from '../../../../core/either'
import type {
  CheckerAdapter,
  ExecuteCheckerProps,
} from '../../../../domain/checker/repositories/checker-adapter'

const DELAY_BETWEEN_REQUESTS_SECONDS = 5

const BASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.6',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'Sec-GPC': '1',
  Priority: 'u=0, i',
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export class Instagram implements CheckerAdapter {
  keyWord: string = 'instagram.com'
  name: string = 'Instagram'
  online: boolean = true
  private static lastRequestTime = 0

  execute = async ({
    content,
  }: ExecuteCheckerProps): Promise<Either<null, string>> => {
    try {
      const now = Date.now()
      const elapsed = now - Instagram.lastRequestTime
      const delayMs = DELAY_BETWEEN_REQUESTS_SECONDS * 1000
      if (elapsed < delayMs) {
        await wait(delayMs - elapsed)
      }

      Instagram.lastRequestTime = Date.now()

      if (!content.includes('sessionid')) {
        return left(null)
      }

      const apiHeaders = {
        ...BASE_HEADERS,
        cookie: content,
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
      }

      const response = await axios.get('https://www.instagram.com/api/v1/direct_v2/inbox/?limit=1', {
        headers: apiHeaders,
        validateStatus: () => true,
        maxRedirects: 0,
      })

      if (response.status === 302 || response.status === 301) {
        return left(null)
      }

      if (response.status !== 200) {
        return left(null)
      }

      const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)

      if (!body.includes('"viewer"')) {
        return left(null)
      }

      return right(`Instagram LIVE ${response.status}`)
    } catch (e) {
      console.log(e)
      return left(null)
    }
  }
}
