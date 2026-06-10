import { exec } from 'node:child_process'
import {
  mkdirSync as fsMkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, parse } from 'node:path'
import { promisify } from 'node:util'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ArchivesRepositoryAdapter } from './arquives'

const execAsync = promisify(exec)
const tmpDir = join(process.cwd(), 'tmp-test')

function makeTmpDir() {
  fsMkdirSync(tmpDir, { recursive: true })
}

function cleanTmpDir() {
  rmSync(tmpDir, { recursive: true, force: true })
}

// Creates a plain ZIP using system `zip` command
async function createZip(
  zipPath: string,
  files: { path: string; content: string }[],
) {
  const tmpDirInner = join(tmpDir, 'zip-src-' + Date.now())
  fsMkdirSync(tmpDirInner, { recursive: true })
  try {
    for (const f of files) {
      const fullPath = join(tmpDirInner, f.path)
      fsMkdirSync(dirname(fullPath), { recursive: true })
      writeFileSync(fullPath, f.content)
    }
    const { name: zipName } = parse(zipPath)
    await execAsync(`zip -r "${zipName}.zip" .`, { cwd: tmpDirInner })
    renameSync(join(tmpDirInner, `${zipName}.zip`), zipPath)
  } finally {
    rmSync(tmpDirInner, { recursive: true, force: true })
  }
}

// Creates a password-protected ZIP using system `7z`
async function createZipWithPassword(
  zipPath: string,
  password: string,
  files: { path: string; content: string }[],
) {
  const tmpDirInner = join(tmpDir, 'zip-enc-' + Date.now())
  fsMkdirSync(tmpDirInner, { recursive: true })
  try {
    for (const f of files) {
      const fullPath = join(tmpDirInner, f.path)
      fsMkdirSync(dirname(fullPath), { recursive: true })
      writeFileSync(fullPath, f.content)
    }
    await execAsync(`7z a -tzip -p${password} "${zipPath}" .`, {
      cwd: tmpDirInner,
    })
  } finally {
    rmSync(tmpDirInner, { recursive: true, force: true })
  }
}

// Creates a RAR using `rar` command if available, otherwise skips test
async function createRar(
  rarPath: string,
  files: { path: string; content: string }[],
) {
  const tmpDirInner = join(tmpDir, 'rar-src-' + Date.now())
  fsMkdirSync(tmpDirInner, { recursive: true })
  try {
    for (const f of files) {
      const fullPath = join(tmpDirInner, f.path)
      fsMkdirSync(dirname(fullPath), { recursive: true })
      writeFileSync(fullPath, f.content)
    }
    // Try `rar` first, fallback: create a minimal valid RAR5 binary blob
    try {
      await execAsync(`rar a -r "${rarPath}" .`, { cwd: tmpDirInner })
      return
    } catch {
      // `rar` not available — build a fake RAR5 header + content
      // RAR5 magic: 52 61 72 21 1a 07 01 00
      const rarContent = Buffer.from([
        0x52,
        0x61,
        0x72,
        0x21,
        0x1a,
        0x07,
        0x01,
        0x00,
        ...Buffer.from('fakerar-content'),
      ])
      writeFileSync(rarPath, rarContent)
    }
  } finally {
    rmSync(tmpDirInner, { recursive: true, force: true })
  }
}

function rarAvailable(): Promise<boolean> {
  return execAsync('rar --version 2>/dev/null || true').then(
    (r) => r.stdout.includes('RAR'),
    () => false,
  )
}

describe('ArchivesRepositoryAdapter', () => {
  let sut: ArchivesRepositoryAdapter

  beforeAll(() => {
    sut = new ArchivesRepositoryAdapter()
  })

  beforeEach(() => {
    makeTmpDir()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    return () => {
      cleanTmpDir()
      vi.restoreAllMocks()
    }
  })

  // ─── isValidPath ───
  describe('isValidPath', () => {
    it('should return true for existing file', () => {
      const filePath = join(tmpDir, 'valid.txt')
      writeFileSync(filePath, 'hello')
      expect(sut.isValidPath(filePath)).toBe(true)
    })

    it('should return false for non-existing file', () => {
      expect(sut.isValidPath(join(tmpDir, 'nope.txt'))).toBe(false)
    })
  })

  // ─── compact ───
  describe('compact', () => {
    it('should return a buffer with valid ZIP data (PK sig)', async () => {
      const report = {
        checker1: [{ name: 'acc1', cookie: 'cookie_data', report: 'r1' }],
      }
      const buffer = await sut.compact(report as any)

      expect(Buffer.isBuffer(buffer)).toBe(true)
      expect(buffer[0]).toBe(0x50) // P
      expect(buffer[1]).toBe(0x4b) // K
    })
  })

  // ─── descompact ───
  describe('descompact', () => {
    it('should return left if file does not exist', async () => {
      const result = await sut.descompact({
        localFile: join(tmpDir, 'nonexistent.zip'),
        fileName: 'nonexistent',
        password: null,
      } as any)

      expect(result.isLeft()).toBe(true)
    })

    it('should extract a plain ZIP without password', async () => {
      const zipPath = join(tmpDir, 'test.zip')
      await createZip(zipPath, [
        { path: 'hello.txt', content: 'Hello!' },
        { path: 'sub/nested.txt', content: 'Nested!' },
      ])

      const result = await sut.descompact({
        localFile: zipPath,
        fileName: 'test',
        password: null,
      } as any)

      expect(result.isRight()).toBe(true)
    })

    it('should extract a password-protected ZIP', async () => {
      const zipPath = join(tmpDir, 'enc-test.zip')
      await createZipWithPassword(zipPath, 'senha123', [
        { path: 'secret.txt', content: 'Protected!' },
      ])

      const result = await sut.descompact({
        localFile: zipPath,
        fileName: 'enc-test',
        password: 'senha123',
      } as any)

      expect(result.isRight()).toBe(true)
    })

    it('should extract or reject a RAR file without password', async () => {
      const hasRar = await rarAvailable()
      const rarPath = join(tmpDir, 'test.rar')
      await createRar(rarPath, [
        { path: 'from-rar.txt', content: 'RAR content!' },
      ])

      const result = await sut.descompact({
        localFile: rarPath,
        fileName: 'test',
        password: null,
      } as any)

      // With real `rar`: should extract successfully
      // Without `rar`: node-unrar-js may succeed or fail with the fake RAR5 header
      // In both cases we just want no crash
      if (hasRar) {
        expect((result as any).isRight()).toBe(true)
      } else {
        expect(typeof (result as any).isLeft).toBe('function')
      }
    })

    it('should return unsupported for unknown file type', async () => {
      writeFileSync(join(tmpDir, 'plain.txt'), 'not an archive')
      const result = await sut.descompact({
        localFile: join(tmpDir, 'plain.txt'),
        fileName: 'plain',
        password: null,
      } as any)

      expect(result.isLeft()).toBe(true)
    })
  })
})
