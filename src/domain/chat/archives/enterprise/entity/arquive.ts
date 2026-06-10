import { Entity } from '../../../../../core/entities/entity'

export interface ArchiveProps {
  localFile: string
  // thisIsUnpacked: boolean;
  password?: string | null
  fileName: string
}

export class Archive extends Entity<ArchiveProps> {
  get fileName() {
    return this.props.fileName
  }
  get password() {
    return this.props.password
  }

  get localFile() {
    return this.props.localFile
  }

  set localFile(newPath) {
    this.props.localFile = newPath
  }
  set fileName(newfileName) {
    this.props.fileName = newfileName
  }

  constructor(props: ArchiveProps) {
    super(props)
  }
}
