import { db } from 'src/lib/db'

export {}

export const user = ({ id }) => {
  return db.user.findUnique({
    where: { id },
  })
}

export const User = {
  posts: (_obj, { root }) => {
    return db.user.findUnique({ where: { id: root?.id } }).posts()
  },
}
