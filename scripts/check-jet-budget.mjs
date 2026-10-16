import { build } from 'esbuild'
import { gzipSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'

const options = {
  bundle: true,
  write: false,
  outdir: '/tmp/sineva-jet-budget-build',
  minify: true,
  format: 'esm',
  platform: 'browser',
  external: ['three', 'three/*', 'react', 'react/*'],
  loader: { '.css': 'empty', '.module.css': 'empty' },
  tsconfig: 'tsconfig.json',
}
const gzip = (result) =>
  gzipSync(Buffer.concat(result.outputFiles.map((file) => file.contents))).length
const entry = 'src/components/mascot/sino-runtime.ts'
const runtime = gzip(await build({ ...options, entryPoints: [entry] }))
const baseline = gzip(
  await build({
    ...options,
    entryPoints: [entry],
    plugins: [
      {
        name: 'baseline',
        setup(api) {
          api.onLoad({ filter: /sino-(runtime|state-machine)\.ts$/ }, ({ path }) => ({
            contents: execFileSync(
              'git',
              ['show', `7f26bd2:${path.slice(process.cwd().length + 1)}`],
              { encoding: 'utf8' },
            ),
            loader: 'ts',
          }))
        },
      },
    ],
  }),
)
const overlay = gzip(
  await build({
    ...options,
    stdin: {
      contents:
        "export {SinoLaunchOverlay} from './src/components/mascot/sino-launch/sino-launch-overlay';export {ThankYouFlight} from './src/components/mascot/sino-launch/thank-you-flight'",
      resolveDir: process.cwd(),
      loader: 'tsx',
    },
  }),
)
const realtimeExtra = Math.max(0, runtime - baseline)
const total = realtimeExtra + overlay
console.log(
  JSON.stringify(
    { realtimeExtraGzip: realtimeExtra, overlayGzip: overlay, totalExtraGzip: total, budget: 6000 },
    null,
    2,
  ),
)
if (realtimeExtra > 4000 || total > 6000) process.exitCode = 1
