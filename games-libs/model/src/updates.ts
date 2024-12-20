export enum UpdateMode {
  Always,
  Optimized,
}

export type Update = {
  time: number
  mode: UpdateMode
}
