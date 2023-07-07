interface Array {
  toReversed(): any[];
}

if (Array.prototype.toReversed === undefined) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.toReversed = function arrayToReversed(): any[] {
    return this.slice().reverse();
  };
}
