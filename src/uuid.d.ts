declare module uuid {
  interface V4Options {
    random?: ArrayLike<number>
    rng?: () => ArrayLike<number>
  }

  function v4(options?: V4Options | null): string
  function v4<T extends ArrayLike<number>>(options: V4Options | null | undefined, buffer: T, offset?: number): T
}