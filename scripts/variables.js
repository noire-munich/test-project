// To access your database
// Append api/* to import from api and web/* to import from web
import { db } from 'api/src/lib/db'

export default async ({ args }) => {
  // Your script here...
  console.log(':: Executing script with args ::')
  console.log(
    'DATABASE_URL',
    process.env.DATABASE_URL.slice(0, 2),
    ' ',
    provess.env.DATABASE_URL.slice(2)
  )
  console.log(
    'SESSION_SECRET',
    process.env.SESSION_SECRET.slice(0, 2),
    ' ',
    provess.env.SESSION_SECRET.slice(2)
  )
}
