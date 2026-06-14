import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Command } from "../repository/command";

export class HandleCommands {
  public commands: Command[] = [];

  protected constructor(commands: Command[]) {
    this.commands = commands;
  }
  static async execute() {
    const pathCommands = join(__dirname, "..", "commands")
    const commandFiles = readdirSync(pathCommands).filter((f) =>
      f.endsWith(".ts"),
    );

    const commandsMapper: Command[] = await Promise.all(
      commandFiles.map(async (file) => {
        const fileUrl = pathToFileURL(join(pathCommands, file)).href
        const mod = await import(fileUrl)
        const CommandClass = mod[Object.keys(mod)[0]]
        if (CommandClass?.name) return new CommandClass();
      }),
    );

    return new HandleCommands(commandsMapper);
  }
}
