import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { readServerEnv } from '../src/env/server'
import { createDatabase } from '../src/lib/db/connection'
import { bootstrapAdmin } from '../src/features/auth/bootstrap.server'

function readHiddenPassword(): Promise<string> {
  stdout.write('Password (12–128 karakter): ')
  stdin.setEncoding('utf8')
  stdin.setRawMode(true)
  stdin.resume()
  return new Promise((resolve, reject) => {
    let value = ''
    const finish = () => {
      stdin.off('data', onData)
      stdin.setRawMode(false)
      stdin.pause()
      stdout.write('\n')
    }
    const onData = (chunk: string) => {
      for (const char of chunk) {
        const code = char.charCodeAt(0)
        if (code === 3 || code === 4) {
          finish()
          reject(new Error('Cancelled'))
          return
        }
        if (code === 13 || code === 10) {
          finish()
          resolve(value)
          return
        }
        if (code === 127 || code === 8) value = Array.from(value).slice(0, -1).join('')
        else if (code >= 32) value += char
        if (value.length > 128) {
          finish()
          reject(new Error('Password too long'))
          return
        }
      }
    }
    stdin.on('data', onData)
  })
}

async function readIdentity(): Promise<unknown> {
  if (process.argv.includes('--stdin')) {
    let content = ''
    for await (const chunk of stdin) {
      content += chunk.toString()
      if (content.length > 8192) throw new Error('Input exceeds limit')
    }
    return JSON.parse(content)
  }
  if (!stdin.isTTY) throw new Error('Interactive terminal or --stdin required')
  const reader = createInterface({ input: stdin, output: stdout })
  const name = await reader.question('Nama Admin: ')
  const email = await reader.question('Email Admin: ')
  reader.close()
  const password = await readHiddenPassword()
  return { name, email, password }
}

async function main() {
  const env = readServerEnv(process.env)
  const url = new URL(env.databaseUrl)
  const confirmed = process.argv
    .find((arg) => arg.startsWith('--confirm-database='))
    ?.slice('--confirm-database='.length)
  if (!confirmed || confirmed !== decodeURIComponent(url.pathname.slice(1)))
    throw new Error('Explicit database confirmation required')
  if (
    !['localhost', '127.0.0.1'].includes(url.hostname) &&
    !process.argv.includes('--allow-remote')
  )
    throw new Error('Remote target needs explicit allowance')
  const input = await readIdentity()
  const connection = createDatabase(env.databaseUrl)
  try {
    const result = await bootstrapAdmin(connection, env, input)
    console.log(
      result.status === 'created'
        ? 'Admin pertama berhasil dibuat.'
        : 'Database sudah memiliki akun; bootstrap tidak membuat akun tambahan.',
    )
  } finally {
    await connection.pool.end()
  }
}

main().catch(() => {
  console.error(
    'Bootstrap gagal. Periksa input, --confirm-database, koneksi/schema dan opsi target remote. Kredensial tidak dicetak.',
  )
  process.exitCode = 1
})
