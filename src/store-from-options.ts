import { RecordingStoreState } from './recording-module';
import { ReduxModuleAny, ReduxModuleTypeContainer } from './redux-module';
import { ReduxModuleStore } from './redux-module-store';
import { ReduxModuleStoreOptions } from './redux-module-store-options';
import { ReloadableStore } from './reloadable-store';

export type StoreFromOptions<
  TReduxModule extends ReduxModuleAny,
  TReduxModuleStoreOptions extends ReduxModuleStoreOptions<
    TReduxModule['_storeStateType']
  >,
  TStoreStateFinal = Readonly<
    TReduxModuleStoreOptions['record'] extends true
      ? TReduxModule['_storeStateType'] &
          RecordingStoreState<TReduxModule['_actionType']>
      : TReduxModule['_storeStateType']
  >,
  TReduxModuleFinal extends ReduxModuleAny = ReduxModuleTypeContainer<
    TReduxModule['_pathType'],
    TReduxModule['_stateType'],
    TReduxModule['_actionType'],
    TReduxModule['_actionCreatorType'],
    TReduxModule['_initializerType'],
    TStoreStateFinal,
    TReduxModule['_storeActionCreatorsType']
  >
> = (TReduxModuleStoreOptions['deferred'] extends true
  ? ReloadableStore<TReduxModuleFinal>
  : {}) &
  ReduxModuleStore<TReduxModuleFinal>;
