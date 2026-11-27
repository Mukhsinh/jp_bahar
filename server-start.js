const { spawn } = require('child_process')
const path = require('path')

const port = process.env.PORT || '3002'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const nextBin = require.resolve('next/dist/bin/next')

const child = spawn(
  process.execPath,
  [nextBin, 'start', '-H', hostname, '-p', String(port)],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: String(port),
      HOSTNAME: hostname,
    },
  }
)

const forwardSignal = (signal) => {
  if (child && !child.killed) {
    child.kill(signal)
  }
}

process.on('SIGTERM', () => forwardSignal('SIGTERM'))
process.on('SIGINT', () => forwardSignal('SIGINT'))

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 0)
  }
})

