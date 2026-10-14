import 'dotenv/config'
import { readServerEnv } from '../../env/server'
import { createDatabase } from '../db/connection'
import { createAuth } from './options'

const env = readServerEnv(process.env)
export const auth = createAuth(createDatabase(env.databaseUrl).db, env)
