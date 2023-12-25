export interface TemplateParts {
  start: string
  before: string[]
  after: string[]
  slots: string[]
}

export interface CacheSettingsCalculated {
  key: string
  ttl?: number
}
