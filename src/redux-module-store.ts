import { Store } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import {
  ReduxModuleTypeContainerAny,
  ReduxModuleTypeContainerStoreState,
  ReduxModuleTypeContainerStoreActionCreator,
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
  actions: Readonly<
    ReduxModuleTypeContainerStoreActionCreator<TReduxModuleTypeContainer>
  >;
  props: Readonly<Required<TReduxModuleTypeContainer['_initializerPropsType']>>;
};
