import { Store } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { ReduxModuleAny } from '.';

export type ReduxModuleStore<TReduxModule extends ReduxModuleAny> = Store<
  TReduxModule['_storeStateType'],
  TReduxModule['_actionType']
> & {
  dispatch: ThunkDispatch<
    TReduxModule['_storeStateType'],
    any,
    TReduxModule['_actionType']
  >;
  actions: Readonly<TReduxModule['_actionCreatorsInStoreType']>;
  props: Readonly<TReduxModule['_initializerPropsType']>;
};
