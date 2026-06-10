import axios from 'axios'
import { left, right, type Either } from '../../../../core/either'
import type {
  CheckerAdapter,
  ExecuteCheckerProps,
} from '../../../../domain/checker/repositories/checker-adapter'

// ── tipos ──────────────────────────────────────────────────────────────────

interface NetflixProfile {
  __typename: string
  guid: string
  name: string
  isKids: boolean
  growthEmail?: {
    email?: { value: string } | null
    isVerified: boolean
  }
  icon?: { url: string }
}

interface NetflixGraphQLResponse {
  data?: {
    growthbrowse?: {
      ownerGuid: string
      countryOfSignUp?: { code: string }
      currentPlan?: {
        plan?: {
          name: string
          availableFeatures?: Array<{ maxCount: number; type: string }>
        }
      }
      membershipStatus: string
      nextBillingDate?: { localDate: string }
      memberSince: string
      profiles: NetflixProfile[]
      extraMemberSlots: unknown[]
    }
  }
}

// ── constantes fora da classe (sem dependência de `this`) ──────────────────

const GRAPHQL_URL = 'https://web.prod.cloud.netflix.com/graphql'

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
  'x-netflix.context.operation-name': 'browseTemplate',
  'x-netflix.request.attempt': '1',
  'x-netflix.request.client.context': '{"appstate":"foreground"}',
  Origin: 'https://www.netflix.com',
  'Content-Type': 'application/json',
} as const

const COUNTRY_FLAGS: Record<string, string> = {
  BR: '🇧🇷',
  US: '🇺🇸',
  EC: '🇪🇨',
  AR: '🇦🇷',
  MX: '🇲🇽',
  CO: '🇨🇴',
  CL: '🇨🇱',
  PE: '🇵🇪',
  UY: '🇺🇾',
  PT: '🇵🇹',
  ES: '🇪🇸',
  DE: '🇩🇪',
  FR: '🇫🇷',
  IT: '🇮🇹',
  GB: '🇬🇧',
  CA: '🇨🇦',
  AU: '🇦🇺',
}

// ── helpers ────────────────────────────────────────────────────────────────

function getFlag(code: string): string {
  return COUNTRY_FLAGS[code?.toUpperCase()] ?? `[${code}]`
}

function formatDate(isoDate?: string): string {
  if (!isoDate) return 'N/A'
  return new Date(isoDate).toLocaleDateString('pt-BR')
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!user || !domain) return email
  return `${user.slice(0, 3)}***@${domain}`
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function generateRequestId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('')
}

// ── adapter ────────────────────────────────────────────────────────────────

export class Netflix implements CheckerAdapter {
  keyWord: string = 'netflix'
  name: string = 'Netflix'
  online: boolean = true
  // arrow function garante que `this` nunca se perde em callbacks/map
  execute = async ({
    content,
  }: ExecuteCheckerProps): Promise<Either<null, string>> => {
    try {
      // Step 1 — valida o cookie checando redirect em /browse
      const validationResponse = await axios({
        url: 'https://www.netflix.com/browse',
        method: 'GET',
        headers: {
          'User-Agent': BASE_HEADERS['User-Agent'],
          cookie: content,
        },
        validateStatus: () => true,
        maxRedirects: 5,
      })

      const finalUrl = validationResponse.request?.['_redirectable']?.[
        '_currentUrl'
      ] as string | undefined

      if (!finalUrl || !finalUrl.includes('netflix.com/browse')) {
        return left(null)
      }

      // Step 2 — busca dados reais via GraphQL
      const graphqlResponse = await axios.post<NetflixGraphQLResponse>(
        GRAPHQL_URL,
        {
          operationName: 'browseTemplate',
          variables: { localeOverride: 'es-EC' },
          extensions: {
            persistedQuery: {
              id: 'd3cdb26a-0e1f-490b-9b2d-c26e22a353d9',
              version: 102,
            },
          },
        },
        {
          headers: {
            ...BASE_HEADERS,
            'x-netflix.request.id': generateRequestId(),
            'x-netflix.request.toplevel.uuid': generateUUID(),
            cookie: content,
          },
          validateStatus: () => true,
        },
      )

      const browse = graphqlResponse.data?.data?.growthbrowse
      if (!browse) return left(null)

      // ── extração dos dados ───────────────────────────────────────────────

      const country = browse.countryOfSignUp?.code ?? 'N/A'
      const flag = getFlag(country)
      const plan = browse.currentPlan?.plan?.name ?? 'N/A'
      const profileCount = browse.profiles?.length ?? 0
      const memberSince = formatDate(browse.memberSince)
      const nextBilling = formatDate(browse.nextBillingDate?.localDate)

      const maxExtraMembers =
        browse.currentPlan?.plan?.availableFeatures?.find(
          (f) => f.type === 'EXTRA_MEMBER',
        )?.maxCount ?? 0

      const usedExtraMembers = browse.extraMemberSlots?.length ?? 0

      const ownerProfile = browse.profiles?.find(
        (p) => p.guid === browse.ownerGuid,
      )
      const ownerEmail = ownerProfile?.growthEmail?.email?.value ?? 'N/A'
      const maskedEmail = maskEmail(ownerEmail)
      const profileNames = browse.profiles?.map((p) => p.name).join(', ') ?? ''

      // ── monta string de saída ────────────────────────────────────────────

      const result = [
        `Netflix`,
        flag,
        `[${country}]`,
        `[${maskedEmail}]`,
        `[${plan}]`,
        // `[Perfis: ${profileCount}]`,
        `[Extra : ${usedExtraMembers}/${maxExtraMembers}]`,
        // `[Próx. Cobrança: ${nextBilling}]`,
        `[${memberSince}]`,
        `[${profileNames}]`,
      ].join(' ')

      return right(result)
    } catch (e) {
      console.log(e)
      return left(null)
    }
  }
}
