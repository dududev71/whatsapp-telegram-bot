import axios from 'axios'
import { left, right, type Either } from '../../../../core/either'
import type {
  CheckerAdapter,
  ExecuteCheckerProps,
} from '../../../../domain/checker/repositories/checker-adapter'

export class Netflix implements CheckerAdapter {
  keyWord: string = 'claude.ai'
  name: string = 'Claude'
  online: boolean = true
  async execute({
    content,
  }: ExecuteCheckerProps): Promise<Either<null, string>> {
    try {
      const { data } = await axios.get('https://claude.ai/api/bootstrap', {
        params: {
          statsig_hashing_algorithm: 'djb2',
          growthbook_format: 'sdk',
          include_system_prompts: 'false',
        },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Sec-GPC': '1',
          Connection: 'keep-alive',
          Cookie: content,
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          Priority: 'u=0, i',
          TE: 'trailers',
        },
      })
      // console.log(data)
      // const url = request['_redirectable']['_currentUrl'] as string
      if (data?.account) {
        const account = data.account
        const email = account?.email_address
        const maskedEmail = email?.replace(/(.{3}).+(@.+)/, '$1***$2')

        const seat = account?.memberships?.[0]?.seat_tier
        const internalSeat = account?.settings?.internal_tier_seat_tier
        const tier = seat || internalSeat
        const plan = !tier
          ? 'Free'
          : tier.includes('pro')
            ? 'Pro'
            : tier.includes('team')
              ? 'Team'
              : tier.includes('enterprise')
                ? 'Enterprise'
                : tier

        const role = account?.memberships?.[0]?.role ?? 'N/A'
        const memberSince = account?.created_at
          ? new Date(account.created_at).toLocaleDateString('pt-BR')
          : 'N/A'
        const webSearch = account?.settings?.enabled_web_search ? '✅' : '❌'
        const phone = account?.verified_phone_number_last4
          ? `****-${account.verified_phone_number_last4}`
          : 'N/A'
        const name = account?.full_name ?? 'N/A'

        console.log('\n\n', content, '\n\n')

        return right(
          [
            `Claude`,
            `[${name}]`,
            `[${maskedEmail}]`,
            `[${plan}]`,
            `[${role}]`,
            `[Desde: ${memberSince}]`,
            `[Web: ${webSearch}]`,
            `[Tel: ${phone}]`,
          ].join(' '),
        )
      }

      return left(null)
    } catch (e) {
      console.log(e)
      return left(null)
    }
  }
}
