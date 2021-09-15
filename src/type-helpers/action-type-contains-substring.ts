import { Action } from 'redux';
import { ToTuple, LengthOfTuple } from '../utils';

export type ActionTypeContainsSubstring<
  TAction extends Action,
  TSubString extends string,
  TSubStringTuple extends string[] = ToTuple<TSubString, '*'>,
  TSubStringTupleLength extends number = LengthOfTuple<TSubStringTuple>
> = TAction extends Action<infer TActionType>
  ? TSubStringTupleLength extends 1
    ? TActionType extends `${string}${TSubStringTuple[0]}${string}`
      ? TAction
      : never
    : TSubStringTupleLength extends 2
    ? TActionType extends `${string}${TSubStringTuple[0]}${string}${TSubStringTuple[1]}${string}`
      ? TAction
      : never
    : TSubStringTupleLength extends 3
    ? TActionType extends `${string}${TSubStringTuple[0]}${string}${TSubStringTuple[1]}${string}${TSubStringTuple[2]}${string}`
      ? TAction
      : never
    : never
  : never;
