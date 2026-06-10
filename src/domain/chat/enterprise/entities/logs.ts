import { Entity } from "../../../../core/entities/entity";

interface LogsProps {
  localFile: string;
  isChecked: boolean;
}

export class Logs<SpecificLogType> extends Entity<
  LogsProps & SpecificLogType
> {}
