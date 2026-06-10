export interface DomainEvent<T = unknown> {
  name: string;
  payload: T;
  occurredAt: Date;
}
