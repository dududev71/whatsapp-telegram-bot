import { Logs } from "./logs";

interface UlpLogsProps {
  nameFile: string;
  lengthFile: string;
}

export class UlpLogs extends Logs<UlpLogsProps> {}
