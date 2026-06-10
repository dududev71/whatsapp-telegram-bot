import type { AnswerCommands, ExecuteAnswerProps } from '../repository/answers'
import type { AnswerWating } from '../utils/answer-wating'

export class CommandAdpter implements AnswerCommands {
  answerKey = 'descompact-response'

  async execute(
    { replys, dependencies, utils }: ExecuteAnswerProps,
    previousAnswer: AnswerWating,
  ): Promise<void> {
    const fileName = utils.buttonReply.id || ''

    if (!fileName) {
      return await replys.replyText('No file selected.')
    }

    await replys.replyText(`Extracting "${fileName}"...`)

    try {
      const archiveRepository = dependencies.archiveRepository
      const downloadsRepository = dependencies.PrismaRepositoryDownloads

      const download = await downloadsRepository.findByFileName(fileName)
      if (!download) {
        return await replys.replyText('File not found in database.')
      }

      const localFile = download.localFile
      const archive = { localFile, fileName, password: null }

      const result = await archiveRepository.descompact(archive as any)

      if (result.isRight()) {
        await replys.replyText(`"${fileName}" extracted successfully.`)
      } else {
        await replys.replyText(`Extraction failed: ${result.value}`)
      }
    } catch (err) {
      console.error('Extract error:', err)
      await replys.replyText('Error during extraction. Try again.')
    }
  }
}
