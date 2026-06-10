import type { FileReportProps } from '../enterprise/file-report'
import type { NotifyProps } from '../enterprise/notify'

export type SendFileToJidInterface = FileReportProps & NotifyProps
export interface NotifyRepositoryPort {
  sendNotifyToJid(data: NotifyProps): Promise<{ key: any }>
  editNotifyToJid(data: NotifyProps & { key: any }): Promise<void>
  sendFileToJid(data: SendFileToJidInterface): Promise<void>
}
