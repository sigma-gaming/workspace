import { autoInjectable } from 'tsyringe'
import { GlobalEntityBaseService, KeyEntityBaseService } from './entity-base'

@autoInjectable()
export class GlobalJsonEntityService<T> extends GlobalEntityBaseService<T> {}

@autoInjectable()
export class KeyJsonEntityService<T> extends KeyEntityBaseService<T> {}
