import { Entity } from "../../../../core/entities/entity";

export interface ArchiveInterface {
  localFile: string

}

export class Archive extends Entity<ArchiveInterface> {}
