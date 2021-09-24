import {Action} from "redux";
import { NotAny } from '../utils';

export type ActionFromActionCreators<TActionCreator> = Extract<
  keyof {
    [K in keyof TActionCreator as TActionCreator[K] extends (
      ...args: any
    ) => infer TMaybeAction
      ? NotAny<TMaybeAction>
      : never]: TActionCreator[K] extends (...args: any) => infer TMaybeAction
      ? NotAny<TMaybeAction>
      : never;
  }
, Action>;
