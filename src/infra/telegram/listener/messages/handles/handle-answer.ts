import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { AnswerCommands } from '../repository/answers'

export class HandleAnswer {
  public commands: AnswerCommands[] = []

  protected constructor(commands: AnswerCommands[]) {
    this.commands = commands
  }

  static async execute() {
    const pathCommands = join(__dirname, '..', 'answers')
    const commandFiles = readdirSync(pathCommands).filter((f) =>
      f.endsWith('.ts'),
    )

    const commandsMapper: AnswerCommands[] = await Promise.all(
      commandFiles.map(async (file) => {
        const fileUrl = pathToFileURL(join(pathCommands, file)).href
        const mod = await import(fileUrl)
        const CommandClass = mod[Object.keys(mod)[0]]
        if (CommandClass?.name) return new CommandClass()
      }),
    )

    return new HandleAnswer(commandsMapper.filter(Boolean))
  }
}
