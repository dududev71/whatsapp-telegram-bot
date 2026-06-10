import { prisma } from '../../../lib/prisma'
import type { CheckerProfileRepository } from '../../../domain/shared/repositories/checker-profile'

export class PrismaRepositoryCheckerProfile implements CheckerProfileRepository {
  async findByJid(jid: string) {
    const row = await prisma.checkerProfile.findUnique({
      where: { jid },
    })
    if (!row) return null
    return {
      jid: row.jid,
      checkers: row.checkers,
    }
  }

  async upsert(jid: string, checkers: string[]): Promise<void> {
    await prisma.checkerProfile.upsert({
      where: { jid },
      update: { checkers },
      create: { jid, checkers },
    })
  }
}
