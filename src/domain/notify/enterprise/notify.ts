import { Entity } from '../../../core/entities/entity'

export interface NotifyProps {
  jidRecipient: string
  content: string
}
export class Notify<subEntitysProps> extends Entity<
  NotifyProps & subEntitysProps
> {}
