import axios from 'axios'
import type { NetflixCookies } from '../../../domain/chat/repositories/netflix'
const BASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
  Accept: '*/*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  Referer: 'https://www.netflix.com/',
  'x-netflix.context.ui-flavor': 'akira',
  'x-netflix.request.originating.url': 'https://www.netflix.com/browse',
  'x-netflix.context.hawkins-version': '5.16.0',
  'x-netflix.context.app-version': 'veb187882',
  'x-netflix.context.locales': 'es-ec',
  'x-netflix.context.operation-name': 'browserTemplate',
  'x-netflix.request.attempt': '1',
  'x-netflix.request.client.context': '{"appstate":"foreground"}',
  Origin: 'https://www.netflix.com',
  'Content-Type': 'application/json',
} as const

export class NetflixCookiesAdapter implements NetflixCookies {
  async isValidCookie(cookieRaw: string): Promise<boolean> {
    const cookie = this.parseCookies(cookieRaw)
    // const response = await axios({
    //   url: 'https://netflix.com/browse',
    //   method: 'GET',
    //   headers: {
    //     Cookie: cookie,
    //   },
    // })
    // const currentUrl = response.request['_redirectable']['_currentUrl']
    // console.log(currentUrl)
    // if (currentUrl === 'https://www.netflix.com/browse') return true
    // return false

    const response = await axios({
      url: 'https://www.netflix.com/browse',
      method: 'GET',
      headers: {
        'User-Agent': BASE_HEADERS['User-Agent'],
        cookie: cookie,
      },
      validateStatus: () => true,
      maxRedirects: 5,
    })

    const currentUrl = response.request['_redirectable']['_currentUrl']
    console.log(currentUrl)
    if (currentUrl === 'https://www.netflix.com/browse') return true
    return false
  }

  parseCookies(raw: string): string {
    return raw
      .trim()
      .split('\n')
      .filter((line) => line.trim() && line.includes('\t'))
      .map((line) => {
        const parts = line.split('\t')
        const name = parts[5]?.trim()
        const value = parts[6]?.trim().replace(/[\r\n]/g, '')
        return `${name}=${value}`
      })
      .join('; ')
      .replace(/[\r\n\t]/g, '') // remove qualquer char inválido
      .trim()
  }
  async LoginTv(code: string, cookieRaw: string): Promise<void> {
    const cookie = this.parseCookies(cookieRaw)
    const userAgents = [
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/97.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:97.0) Gecko/20100101 Firefox/97.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/97.0.1072.62 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36',
    ]

    const getStr = (string: string, start: string, end: string) => {
      return string.match(`${start}(.*?)${end}`)?.[1]
    }

    const getAuthUrlToken = await axios({
      url: 'https://netflix.com/tv2',
      method: 'GET',
      headers: {
        Cookie: cookie,
      },
    })

    const AuthUrlToken = getStr(getAuthUrlToken.data, 'authURL" value="', '"')
    if (!getAuthUrlToken)
      throw new Error('ocorreu um erro interno, por favor tente novamente')
    const response = await axios.post(
      'https://www.netflix.com/tv2',
      new URLSearchParams({
        flow: 'websiteSignUp',
        authURL: AuthUrlToken as string,
        flowMode: 'enterTvLoginRendezvousCode',
        withFields: 'tvLoginRendezvousCode,isTvUrl2',
        code: code,
        tvLoginRendezvousCode: code,
        isTvUrl2: 'true',
        action: 'nextAction',
      }),
      {
        headers: {
          authority: 'www.netflix.com',
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'cache-control': 'max-age=0',
          cookie: cookie,
          origin: 'https://www.netflix.com',
          referer: 'https://www.netflix.com/tv2',
          'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-model': '""',
          'sec-ch-ua-platform': '"Linux"',
          'sec-ch-ua-platform-version': '""',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          'user-agent': userAgents[0],
        },
      },
    )
    console.log(userAgents[Math.floor(Math.random() * userAgents.length)])
    const currentUrl = response.request['_redirectable']['_currentUrl']
    console.log('currentUrl', currentUrl)
    const { data } = response
    if (
      data.includes('class="nf-message-contents" data-uia="UIMessage-content">')
    )
      throw new Error(
        'codigo invalido ! ou possivel erro interno, tente novamente',
      )

    if (
      currentUrl !== 'https://www.netflix.com/browse' &&
      currentUrl !== 'https://www.netflix.com/tv/out/success'
    )
      throw new Error('Ocorreu um erro interno, tente novamente ')
  }
}
