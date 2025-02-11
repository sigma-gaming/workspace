export enum UpdateMode {
  Always,
  Optimized,
}

export type Update<T> = {
  time: number
  mode: UpdateMode
  data: T
}

export type UserUpdate<T> = {
  time: number
  mode: UpdateMode
  userId: string
  data: T
}
