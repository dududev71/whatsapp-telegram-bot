export class NewNotifyEvent {
  name = 'new-notify'

  constructor(
    public payload: {
      content: string
      jidRecipient: string
    },
  ) {}
}
