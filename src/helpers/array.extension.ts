// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Array<T> {
  toReversed(): T[];
}

if (Array.prototype.toReversed === undefined) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.toReversed = function arrayToReversed(): any[] {
    return this.slice().reverse();
  };
}
