import { MiddlewareAPI, Dispatch, AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { ReduxModuleTypeContainerAny } from './redux-module';

export interface ReduxModuleMiddleware<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TStoreStateFinal = Readonly<TReduxModuleTypeContainer['_storeStateType']>,
  TDispatch extends ThunkDispatch<
    TStoreStateFinal,
    any,
    TReduxModuleTypeContainer['_actionType']
  > = ThunkDispatch<
    TStoreStateFinal,
    any,
    TReduxModuleTypeContainer['_actionType']
  >
> {
  (
    api: MiddlewareAPI<TDispatch, TStoreStateFinal> & {
      actions: Readonly<
        TReduxModuleTypeContainer['_storeActionCreatorsWithLocalType']
      >;
      props: Readonly<
        Required<TReduxModuleTypeContainer['_initializerPropsType']>
      >;
    }
  ): (
    next: Dispatch<AnyAction>
  ) => (action: TReduxModuleTypeContainer['_actionType']) => any;
}
