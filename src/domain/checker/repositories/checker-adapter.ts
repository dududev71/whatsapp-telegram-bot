import type { Either } from '../../../core/either'

export interface ExecuteCheckerProps {
  content: string
  // agent
}

export interface CheckerAdapter {
  name: string
  keyWord: string
  online: boolean
  execute({ content }: ExecuteCheckerProps): Promise<Either<null, string>>
}
