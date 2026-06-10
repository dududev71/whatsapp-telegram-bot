import { UniqueEntityId } from "./uniqueEntityId";

export class Entity<GenericProps> {
  public _id: UniqueEntityId;
  protected props: GenericProps;

  protected constructor(props: GenericProps) {
    this._id = new UniqueEntityId();
    this.props = props;
  }
}
