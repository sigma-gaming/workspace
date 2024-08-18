import { createSingletonProxy } from '@core/di'
import { UnauthorizedException } from '@core/exceptions'
import { UserSelect } from '@dbs/games-schema'
import { UserRole } from '@dbs/games-types'
import { singleton } from 'tsyringe-neo'

@singleton()
export class RoleService {
  hasRole(user: UserSelect, role: UserRole | UserRole[]) {
    if (Array.isArray(role)) {
      return user.roles.some((userRole) => role.includes(userRole))
    }

    return user.roles.includes(role)
  }

  assert(user: UserSelect, role: UserRole | UserRole[]) {
    const hasRole = this.hasRole(user, role)
    if (!hasRole) throw new UnauthorizedException()
  }
}

export const roleService = createSingletonProxy(RoleService)
