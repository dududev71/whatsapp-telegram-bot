export class NewFileReportEvent {
  name = 'new-report'

  constructor(
    public payload: {
      content: string
      jidRecipient: string
      fileContent: Buffer
    },
  ) {}
}
