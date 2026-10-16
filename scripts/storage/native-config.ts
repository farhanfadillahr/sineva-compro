import { join } from 'node:path'

export function nativeCommands(root: string, secrets: string, s3port: number): string[][] {
  return [
    [
      'master',
      '-port=19333',
      '-port.grpc=29333',
      `-mdir=${join(root, 'master')}`,
      '-volumeSizeLimitMB=32',
      '-defaultReplication=000',
    ],
    [
      'volume',
      '-port=18080',
      '-port.grpc=28080',
      '-master=127.0.0.1:19333',
      `-dir=${join(root, 'volume')}`,
      '-max=32',
    ],
    [
      'filer',
      '-port=18888',
      '-port.grpc=28888',
      '-master=127.0.0.1:19333',
      `-defaultStoreDir=${join(root, 'filer')}`,
    ],
    [
      's3',
      `-port=${s3port}`,
      `-port.grpc=${s3port + 10000}`,
      '-filer=127.0.0.1:18888',
      '-port.iceberg=0',
      '-port.lance=0',
      '-iam=false',
      `-localSocket=${join(root, 's3.sock')}`,
      `-config=${join(secrets, 's3.json')}`,
    ],
  ].map((args) => [...args, '-ip=127.0.0.1', '-ip.bind=127.0.0.1'])
}
