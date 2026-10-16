import { expect, it } from 'vitest'
import { nativeCommands } from '../../scripts/storage/native-config'

it('binds every native component explicitly to loopback and disables unneeded S3 listeners', () => {
  const commands = nativeCommands('/private/tmp/sineva-owned', '/private/tmp/sineva-secrets', 18333)
  expect(commands).toHaveLength(4)
  for (const command of commands) {
    expect(command).toContain('-ip=127.0.0.1')
    expect(command).toContain('-ip.bind=127.0.0.1')
  }
  const s3 = commands.find((c) => c.includes('s3'))
  expect(s3).toContain('-port.iceberg=0')
  expect(s3).toContain('-port.lance=0')
  expect(s3).toContain('-iam=false')
  expect(s3).toContain('-localSocket=/private/tmp/sineva-owned/s3.sock')
})
