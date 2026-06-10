import { getTdjson } from 'prebuilt-tdlib'
import { configure, createClient, type Client } from 'tdl'

configure({ tdjson: getTdjson() })

export abstract class TelegramBaseRepository {
  static #sharedClient: Client | null = null

  protected constructor(protected readonly client: Client) {}

  static async getClient(): Promise<Client> {
    if (TelegramBaseRepository.#sharedClient) {
      return TelegramBaseRepository.#sharedClient
    }

    const client = createClient({
      apiId: 37335293,
      apiHash: '83be25e5aeb3167948f9b7fba5cf89b9',
      databaseDirectory: '.tdlib/db',
      filesDirectory: '.tdlib/files',
    })

    try {
      await client.login(() => ({
        getPhoneNumber: async () => {
          process.stdout.write('Phone number: ')
          return new Promise((resolve) => {
            process.stdin.once('data', (d) => resolve(d.toString().trim()))
          })
        },
        getAuthCode: async () => {
          process.stdout.write('Auth code: ')
          return new Promise((resolve) => {
            process.stdin.once('data', (d) => resolve(d.toString().trim()))
          })
        },
        getPassword: async () => {
          process.stdout.write('2FA password: ')
          return new Promise((resolve) => {
            process.stdin.once('data', (d) => resolve(d.toString().trim()))
          })
        },
      }))

      TelegramBaseRepository.#sharedClient = client
      return client
    } catch (err: any) {
      console.error('[TDLib] Login error:', err.message)
      throw err
    }
  }
}
