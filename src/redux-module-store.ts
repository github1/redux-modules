import { Store } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { ReduxModule, ReduxModuleTypeContainerAny } from '.';

export type ReduxModuleStore<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> = Store<
  Readonly<TReduxModuleTypeContainer['_storeStateType']>,
  TReduxModuleTypeContainer['_actionType']
> & {
  dispatch: ThunkDispatch<
    TReduxModuleTypeContainer['_storeStateType'],
    any,
    TReduxModuleTypeContainer['_actionType']
  >;
  module: ReduxModule<TReduxModuleTypeContainer>;
  actions: Readonly<TReduxModuleTypeContainer['_storeActionCreatorsType']>;
  props: Readonly<Required<TReduxModuleTypeContainer['_initializerPropsType']>>;
};
