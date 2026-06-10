import { Notify } from './notify'

export interface FileReportProps {
  fileContent: Buffer
}

export class FileReport extends Notify<FileReportProps> {}
