import { randomUUID } from "node:crypto";

export class UniqueEntityId {
  private _id: string;

  constructor(id?: string) {
    this._id = id ?? randomUUID();
  }

  get id(): string {
    return this._id;
  }

  get toString() {
    return this._id;
  }
}
