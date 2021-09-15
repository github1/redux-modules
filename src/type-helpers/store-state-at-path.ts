import { ToTuple, TypeOfNestedPropertiesFromKeys } from '../utils';

export type StoreStateAtPath<
  TState = any,
  TStorePath extends string = string,
  TStorePathTuple extends string[] = ToTuple<TStorePath, '.' | '/' | '->'>
> = '_' extends TStorePathTuple[0]
  ? {}
  : TypeOfNestedPropertiesFromKeys<TState, TStorePathTuple>;
