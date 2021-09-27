import { Store } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import {
  ReduxModule,
  ReduxModuleTypeContainerAny,
  ReduxModuleTypeContainerStoreState,
} from '.';

export type ReduxModuleStore<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> = Store<
  Readonly<ReduxModuleTypeContainerStoreState<TReduxModuleTypeContainer>>,
  TReduxModuleTypeContainer['_actionType']
> & {
  dispatch: ThunkDispatch<
    ReduxModuleTypeContainerStoreState<TReduxModuleTypeContainer>,
    any,
    TReduxModuleTypeContainer['_actionType']
  >;
  module: ReduxModule<TReduxModuleTypeContainer>;
  actions: Readonly<TReduxModuleTypeContainer['_storeActionCreatorsType']>;
  props: Readonly<Required<TReduxModuleTypeContainer['_initializerPropsType']>>;
};
