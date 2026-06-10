import archiver from 'archiver'
import extract from 'extract-zip'
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path, { join } from 'node:path'
import { PassThrough } from 'node:stream'
import unzipper from 'unzipper'
import { left, right, type Either } from '../../../core/either'
import type { Archive } from '../../../domain/chat/archives/enterprise/entity/arquive'
import type { ArchivesRepository } from '../../../domain/chat/archives/repositories/arquives'
import type { ReportForCompact } from '../../../domain/shared/arquives/interfaces/compact'
import { createExtractorFromData } from 'node-unrar-js'
import { spawn } from 'node:child_process'
import os from 'node:os'

function get7zBinPaths(): string[] {
  const platform = os.platform()
  if (platform === 'win32') {
    return [
      '7z',
      '7z.exe',
      'C:\\Program Files\\7-Zip\\7z.exe',
      'C:\\Program Files (x86)\\7-Zip\\7z.exe',
    ]
  }
  return ['7z', '7zz', '7za']
}

async function find7zBin(): Promise<string> {
  const bins = get7zBinPaths()
  const { exec } = await import('node:child_process')
  const { promisify } = await import('node:util')
  const execAsync = promisify(exec)

  for (const bin of bins) {
    try {
      await execAsync(`"${bin}" --help`)
      return bin
    } catch {
      continue
    }
  }
  throw new Error('7-Zip not found. Install 7-Zip to extract split/corrupted archives.')
}

async function extractWith7z(
  inputPath: string,
  outputDir: string,
  password?: string,
): Promise<void> {
  const bin = await find7zBin()
  const args = ['x', inputPath, `-o${outputDir}`, '-y']
  if (password) args.push(`-p${password}`)

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', (d) => (stderr += d.toString()))
    child.on('error', reject)
    child.on('close', (code) => {
      // 0 = OK, 1 = warnings, 2 = fatal errors (but files still extracted, e.g. CRC/split)
      resolve()
    })
  })
}

async function detectFileType(
  filePath: string,
): Promise<'zip' | 'rar' | 'rar5' | 'unknown'> {
  const fd = openSync(filePath, 'r')
  const buffer = Buffer.alloc(8)
  readSync(fd, buffer, 0, 8, 0)
  closeSync(fd)

  // ZIP: PK (50 4B 03 04)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) return 'zip'

  // RAR5: 52 61 72 21 1A 07 01 00
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x61 &&
    buffer[2] === 0x72 &&
    buffer[3] === 0x21 &&
    buffer[4] === 0x1a &&
    buffer[5] === 0x07 &&
    buffer[6] === 0x01
  )
    return 'rar5'

  // RAR4: 52 61 72 21 1A 07 00
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x61 &&
    buffer[2] === 0x72 &&
    buffer[3] === 0x21 &&
    buffer[4] === 0x1a &&
    buffer[5] === 0x07 &&
    buffer[6] === 0x00
  )
    return 'rar'

  return 'unknown'
}

export class ArchivesRepositoryAdapter implements ArchivesRepository {
  async compact(report: ReportForCompact): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const passThrough = new PassThrough()
      const archive = archiver('zip', { zlib: { level: 9 } })

      passThrough.on('data', (chunk) => chunks.push(chunk))
      passThrough.on('end', () => resolve(Buffer.concat(chunks)))
      passThrough.on('error', reject)
      archive.on('error', reject)

      archive.pipe(passThrough)

      const values = Object.entries(report)
      for (const [checkerName, accounts] of values) {
        for (const { cookie, report } of accounts) {
          archive.append(cookie, { name: `${checkerName}/${report}.txt` })
        }
      }

      archive.finalize()
    })
  }

  async descompact({
    localFile,
    password,
  }: Archive): Promise<Either<string, string>> {
    const { dir, name } = path.parse(localFile)
    console.log('Processing file:', localFile)

    if (!existsSync(localFile)) {
      return left('File does not exist')
    }

    const fileType = await detectFileType(localFile)
    console.log('Detected file type:', fileType)

    try {
      const outputDir = join(dir, name)
      mkdirSync(outputDir, { recursive: true })

      if (fileType === 'zip') {
        try {
          if (password) {
            // ZIP com senha: unzipper suporta password
            const zip = await unzipper.Open.file(localFile)
            for (const file of zip.files) {
              if (file.type === 'Directory') continue
              const content = await file.buffer(password)
              if (!content || Buffer.isBuffer(content) === false) continue
              const outputPath = path.join(outputDir, file.path)
              mkdirSync(path.dirname(outputPath), { recursive: true })
              writeFileSync(outputPath, content)
            }
          } else {
            // ZIP sem senha: extract-zip (mais rápido e confiável)
            await extract(localFile, { dir: outputDir })
          }
        } catch {
          // Fallback: split archives (.001), corrupted ZIPs, etc.
          await extractWith7z(localFile, outputDir, password ?? undefined)
        }

        rmSync(localFile)
        return right(outputDir)
      }

      if (fileType === 'rar5' || fileType === 'rar') {
        if (password) {
          return left(
            'RAR files with password are not supported. Please extract manually or use a ZIP file instead.',
          )
        }

        // RAR sem senha: node-unrar-js
        const fileData = await import('node:fs/promises').then((mod) =>
          mod.readFile(localFile),
        )
        const extractor = await createExtractorFromData({
          data: fileData.buffer.slice(
            fileData.byteOffset,
            fileData.byteOffset + fileData.byteLength,
          ),
        })
        const { files } = extractor.extract()

        for (const file of files) {
          const outputPath = path.join(outputDir, file.fileHeader.name)
          if (file.fileHeader.flags.directory) continue
          if (!file.extraction) continue
          mkdirSync(path.dirname(outputPath), { recursive: true })
          writeFileSync(outputPath, file.extraction as Buffer)
        }

        rmSync(localFile)
        return right(outputDir)
      }

      return left('Unsupported file format')
    } catch (e: any) {
      console.error('Extraction failed:', e)
      return left(`Extraction failed: ${e?.message || String(e)}`)
    }
  }

  isValidPath(localFile: string): boolean {
    return existsSync(localFile)
  }
}
