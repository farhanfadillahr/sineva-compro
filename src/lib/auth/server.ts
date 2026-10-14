import 'server-only'
import { readServerEnv } from '../../env/server'
import { db } from '../db/client.server'
import { createAuth } from './options'

export const auth = createAuth(db, readServerEnv(process.env))
