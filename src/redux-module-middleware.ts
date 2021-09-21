import { MiddlewareAPI, Dispatch, AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { ReduxModuleAny } from './redux-module';

export interface ReduxModuleMiddleware<
  TReduxModule extends ReduxModuleAny,
  TStoreStateFinal = Readonly<TReduxModule['_storeStateType']>,
  TDispatch extends ThunkDispatch<
    TStoreStateFinal,
    any,
    TReduxModule['_actionType']
  > = ThunkDispatch<TStoreStateFinal, any, TReduxModule['_actionType']>
> {
  (
    api: MiddlewareAPI<TDispatch, TStoreStateFinal> & {
      actions: Readonly<TReduxModule['_storeActionCreatorsType']>;
      props: Readonly<TReduxModule['_initializerRequiredPropsType']>;
    }
  ): (
    next: Dispatch<AnyAction>
  ) => (action: TReduxModule['_actionType']) => any;
}
