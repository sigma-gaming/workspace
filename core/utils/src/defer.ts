export type Defer<Rs = void, Rj = Error> = {
  readonly promise: Promise<Rs>
  readonly resolve: (value: Rs) => void
  readonly reject: (error: Rj) => void
}

export function createDefer<Rs = void, Rj = Error>(): Defer<Rs, Rj> {
  let resolveFn: Defer<Rs, Rj>['resolve']
  let rejectFn: Defer<Rs, Rj>['reject']

  return {
    promise: new Promise((resolve, reject) => {
      resolveFn = resolve
      rejectFn = reject
    }),
    get resolve() {
      return resolveFn
    },
    get reject() {
      return rejectFn
    },
  }
}
