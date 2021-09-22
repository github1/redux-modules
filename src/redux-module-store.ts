import { Store } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { ReduxModuleTypeContainerAny } from '.';

export type ReduxModuleStore<TReduxModule extends ReduxModuleTypeContainerAny> = Store<
  Readonly<TReduxModule['_storeStateType']>,
  TReduxModule['_actionType']
> & {
  dispatch: ThunkDispatch<
    TReduxModule['_storeStateType'],
    any,
    TReduxModule['_actionType']
  >;
  actions: Readonly<TReduxModule['_storeActionCreatorsType']>;
  props: Readonly<TReduxModule['_initializerRequiredPropsType']>;
};
