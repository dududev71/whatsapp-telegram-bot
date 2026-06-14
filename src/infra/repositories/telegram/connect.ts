import { createRequire } from 'module'
import { Client } from 'pg'

const require = createRequire(import.meta.url)
const { load } = require('./tdl-loader.cjs')

let _configure: any
let _createClient: any

async function initTdl() {
  if (_configure) return
  const { configure, createClient, getTdjson } = await load()
  _configure = configure
  _createClient = createClient
  configure({ tdjson: getTdjson() })
}

export abstract class TelegramBaseRepository {
  static #sharedClient: Client | null = null

  protected constructor(protected readonly client: Client) {}

  static async getClient(): Promise<Client> {
    await initTdl()

    if (TelegramBaseRepository.#sharedClient) {
      return TelegramBaseRepository.#sharedClient
    }

    const client = _createClient({
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
