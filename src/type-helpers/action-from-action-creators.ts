import { RestrictToAction } from './restrict-to-action';
import { NotAny } from '../utils';

export type ActionFromActionCreators<TActionCreator> = RestrictToAction<
  keyof {
    [K in keyof TActionCreator as TActionCreator[K] extends (
      ...args: any
    ) => infer TMaybeAction
      ? NotAny<TMaybeAction>
      : never]: TActionCreator[K] extends (...args: any) => infer TMaybeAction
      ? NotAny<TMaybeAction>
      : never;
  }
>;
