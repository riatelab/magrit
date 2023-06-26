import { createStore } from 'solid-js/store';

type MapStoreType = {
  projection: string,
  translate: number[],
  scale: number,
  center: number[],
  rotate: number[],
}