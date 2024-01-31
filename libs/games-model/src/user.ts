import { User as PrismaUser } from '@libs/games-db'

export enum UserRole {
  User = 'User',
  Moderator = 'Moderator',
  Admin = 'Admin',
}

export interface User {
  id: string
  createdAt: string
  updatedAt: string
  roles: UserRole[]
}

export function normalizeUser(user: PrismaUser): User {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles: user.roles as UserRole[],
  }
}
