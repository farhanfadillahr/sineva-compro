import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

const password = randomBytes(24).toString('base64url')
const secret = randomBytes(48).toString('base64url')
const values = {
  POSTGRES_PASSWORD: password,
  DATABASE_URL: `postgresql://sineva:${password}@127.0.0.1:5432/sineva_compro`,
  TEST_DATABASE_URL: `postgresql://sineva:${password}@127.0.0.1:5433/sineva_compro_test`,
  PAYLOAD_SECRET: secret,
}
let content = readFileSync('.env.example', 'utf8')
for (const [key, value] of Object.entries(values)) {
  content = content.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`)
}
try {
  writeFileSync('.env', content, { flag: 'wx', mode: 0o600 })
  console.log('Created .env for local development; credentials were not printed.')
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
    console.error('.env already exists; refusing to overwrite it.')
    process.exitCode = 1
  } else {
    throw error
  }
}
