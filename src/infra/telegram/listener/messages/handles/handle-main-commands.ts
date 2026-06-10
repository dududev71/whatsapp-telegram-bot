import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from '../repository/command'

export class HandleCommands {
  public commands: Command[] = []

  protected constructor(commands: Command[]) {
    this.commands = commands
  }

  static async execute() {
    const pathCommands = join(__dirname, '..', 'commands')
    const commandFiles = readdirSync(pathCommands).filter((f) =>
      f.endsWith('.ts'),
    )

    const commandsMapper: Command[] = await Promise.all(
      commandFiles.map(async (file) => {
        const {
          [Object.keys(await import(`${pathCommands}/${file}`))[0]]: CommandClass,
        } = await import(`${pathCommands}/${file}`)
        if (CommandClass?.name) return new CommandClass()
      }),
    )

    return new HandleCommands(commandsMapper)
  }
}
