import { readdirSync } from 'node:fs'
import { join } from 'node:path'
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
        const {
          [Object.keys(await import(`${pathCommands}/${file}`))[0]]: CommandClass,
        } = await import(`${pathCommands}/${file}`)
        if (CommandClass?.name) return new CommandClass()
      }),
    )

    return new HandleAnswer(commandsMapper.filter(Boolean))
  }
}
