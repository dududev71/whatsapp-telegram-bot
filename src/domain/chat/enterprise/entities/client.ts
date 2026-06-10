import { Entity } from "../../../../core/entities/entity";

interface ClientProps {
  userName: string;
}

export class Client<ClientPropsForSpecificMethod> extends Entity<
  ClientProps & ClientPropsForSpecificMethod
> {}
