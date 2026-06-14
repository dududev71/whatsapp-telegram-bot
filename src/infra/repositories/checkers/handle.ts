import { readdirSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'node:url'
import type { Either } from '../../../core/either'
import type { CheckerAdapter } from '../../../domain/checker/repositories/checker-adapter'
import type {
  CheckerInfo,
  CheckerResponse,
  HandleSourcesPort,
} from '../../../domain/checker/repositories/handle-sources'

interface CookiesStoredInterface {
  [key: string]: {
    keyWord: string
    name: string
    execute: CheckerAdapter['execute']
    linesMacth: string[]
  }
}

interface OkPromiseReturn {
  cookie: string
  checkerName: string
  result: Either<null, string>
}

export class HandleSources implements HandleSourcesPort {
  private Sources: CheckerAdapter[]

  protected constructor(sources: CheckerAdapter[]) {
    this.Sources = sources
  }

  static async start() {
    const pathCommands = join(__dirname, 'sources')
    const commandFiles = readdirSync(pathCommands).filter((f) =>
      f.endsWith('.ts'),
    )

    const commandsMapper: CheckerAdapter[] = await Promise.all(
      commandFiles.map(async (file) => {
        const fileUrl = pathToFileURL(join(pathCommands, file)).href
        const mod = await import(fileUrl)
        const CommandClass = mod[Object.keys(mod)[0]]
        if (CommandClass?.name) return new CommandClass()
      }),
    )

    return new HandleSources(commandsMapper)
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
  async execute(content: string, selectedCheckers?: string[]): Promise<CheckerResponse[]> {
    const cookiesStoreds: CookiesStoredInterface = {}

    for (const line of content.split('\n')) {
      const lineContainKeyWord = this.Sources.filter(
        ({ keyWord, online, name }) => {
          if (!online) return false
          if (selectedCheckers && !selectedCheckers.includes(name)) return false
          return line.includes(keyWord)
        },
      )

      if (lineContainKeyWord.length <= 0) continue
      if (lineContainKeyWord.length > 1) {
        console.error(
          'A linha contem mais de um keyword, algo de errado aconteeu ',
          lineContainKeyWord,
        )
      }
      const { execute, keyWord, name } = lineContainKeyWord[0]
      if (!cookiesStoreds?.[name]) {
        cookiesStoreds[name] = {
          execute,
          keyWord,
          linesMacth: [line],
          name: name,
        }
        continue
      }
      cookiesStoreds[name] = {
        ...cookiesStoreds[name],
        linesMacth: [...cookiesStoreds[name].linesMacth, line],
      }
    }

    const checkersRunning = Object.values(cookiesStoreds)
      .filter(({ linesMacth }) => {
        const parsedCookies = this.parseCookies(linesMacth.join('\n'))
        return parsedCookies.split('; ').some((cookie) => {
          const [cookieName, cookieValue] = cookie.split('=')
          return cookieName?.trim() && cookieValue?.trim()
        })
      })
      .map(async ({ execute, name, linesMacth }) => {
        return {
          cookie: linesMacth.join('\n'),
          checkerName: name,
          result: await execute({
            content: this.parseCookies(linesMacth.join('\n')),
          }),
        }
      })

    const results = await Promise.allSettled(checkersRunning)
    const livesResults = results.filter(
      (response): response is PromiseFulfilledResult<OkPromiseReturn> =>
        response.status === 'fulfilled' && response.value.result.isRight(),
    )
    const formatterLives: CheckerResponse[] = livesResults.map((res) => {
      return {
        report: res.value.result.value || 'unknow report',
        cookies: res.value.cookie,
        checkerName: res.value.checkerName,
      }
    })

    return formatterLives
  }

  listCheckers(): CheckerInfo[] {
    return this.Sources.map(({ name, keyWord, online }) => ({
      name,
      keyWord,
      online,
    }))
  }
}
