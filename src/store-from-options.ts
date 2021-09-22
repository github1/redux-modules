import { ReduxModuleCompositeWith } from '.';
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
  TReduxModuleFinal extends ReduxModuleAny = TReduxModuleStoreOptions['record'] extends true
    ? ReduxModuleCompositeWith<
        TReduxModule,
        ReduxModuleTypeContainer<
          'recording',
          RecordingStoreState<TReduxModule['_actionType']>['recording'],
          undefined,
          undefined,
          undefined
        >
      >
    : TReduxModule
> = (TReduxModuleStoreOptions['deferred'] extends true
  ? ReloadableStore<TReduxModuleFinal>
  : {}) &
  ReduxModuleStore<TReduxModuleFinal>;
