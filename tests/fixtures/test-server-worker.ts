import { readFile } from 'node:fs/promises'
import { withTestServer } from '../../scripts/lib/with-test-server'
const config = JSON.parse(await readFile(process.argv[2], 'utf8'))
process.exitCode = await withTestServer({
  ...config,
  readyUrl: new URL(config.readyUrl),
  env: process.env,
})
