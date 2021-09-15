import { Action, AnyAction } from 'redux';
import { RestrictToAction } from './restrict-to-action';

export type ActionFromReducer<
  TReducer,
  TDefault extends Action = AnyAction
> = TReducer extends (state: any, action: infer TAction, ...rest: any[]) => any
  ? RestrictToAction<TAction, TDefault>
  : TDefault;
