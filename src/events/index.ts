type EventHandler<T = any> = (event: T) => void | Promise<void>

export class EventDispatcher {
  private handlers: Record<string, EventHandler[]> = {}

  /**
   * Registrar um handler para um evento
   */
  register<T>(eventName: string, handler: EventHandler<T>) {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = []
    }

    this.handlers[eventName].push(handler)
  }

  /**
   * Disparar um evento
   */
  async dispatch(event: { name: string }) {
    const handlers = this.handlers[event.name]

    if (!handlers || handlers.length === 0) return

    for (const handler of handlers) {
      await handler(event)
    }
  }

  /**
   * Remover handlers de um evento (opcional)
   */
  unregister(eventName: string) {
    delete this.handlers[eventName]
  }

  /**
   * Limpar tudo (útil em testes)
   */
  clear() {
    this.handlers = {}
  }
}
