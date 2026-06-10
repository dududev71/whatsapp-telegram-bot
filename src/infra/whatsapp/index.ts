import {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
} from '@itsukichan/baileys'
import type Boom from 'boom'
import { existsSync, rmdirSync } from 'node:fs'
import logger from 'pino'
import QR from 'qrcode-terminal'
import type { WaSocketReturnType } from '../../@types/whatsapp'

export class Connection {
  public WaSocket: WaSocketReturnType

  constructor(socket: WaSocketReturnType) {
    this.WaSocket = socket
  }

  static async handle(): Promise<Connection> {
    const { saveCreds, state } = await useMultiFileAuthState('./sessions-bot')
    const { version } = await fetchLatestBaileysVersion()

    const waSock = makeWASocket({
      version,
      auth: state,
      logger: logger({ level: 'silent' }),
      browser: Browsers.macOS('Desktop'),
      syncFullHistory: true,
    })

    return new Promise((resolve, reject) => {
      waSock.ev.on('creds.update', saveCreds)
      waSock.ev.on('connection.update', (update) => {
        const { qr, connection, lastDisconnect } = update
        console.log('connection update')
        if (qr) {
          console.log('qr code')
          QR.generate(qr, { small: true })
        }
        console.log('sla')
        if (connection === 'open') {
          console.log('connected!')
          resolve(new Connection(waSock))
        }

        if (connection === 'close') {
          console.log('closed ')
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
          console.log('status code ', statusCode)
          if (statusCode === DisconnectReason.loggedOut) {
            if (existsSync('./sessions-bot')) rmdirSync('./sessions-bot')
            reject(new Error('Expired Session'))
          }
          setTimeout(() => {
            Connection.handle()
          }, 2000)
        }
      })
    })
  }
}
