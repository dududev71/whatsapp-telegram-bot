import { TelegramConnection } from './telegram/Connection'
import { TelegramListener } from './telegram/listener/messages'
;(async () => {
  // start WhatsApp
  // const whatsappBot = await Connection.handle()
  // const whatsappListener = await Listener.start(whatsappBot, {
  //   prefix: '/',
  //   readHistory: false,
  // })
  // whatsappListener.handle()
  // console.log('✅ WhatsApp bot started')

  // start Telegram
  const telegramBot = await TelegramConnection.handle()
  console.log('✅ Telegram bot created')
  const telegramListener = await TelegramListener.start(telegramBot, {
    prefix: '/',
    readHistory: false,
  })
  telegramListener.handle()
  telegramBot.launch()
  console.log('✅ Telegram bot launched and listening')
})()
