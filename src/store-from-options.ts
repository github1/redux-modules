import { ReduxModuleTypeContainerCombinedWith } from '.';
import { RecordingStoreState } from './recording-module';
import { ReduxModuleTypeContainerAny, ReduxModuleTypeContainer } from './redux-module';
import { ReduxModuleStore } from './redux-module-store';
import { ReduxModuleStoreOptions } from './redux-module-store-options';
import { ReloadableStore } from './reloadable-store';

export type StoreFromOptions<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TReduxModuleStoreOptions extends ReduxModuleStoreOptions<
    TReduxModuleTypeContainer['_storeStateType']
  >,
  TReduxModuleFinal extends ReduxModuleTypeContainerAny = TReduxModuleStoreOptions['record'] extends true
    ? ReduxModuleTypeContainerCombinedWith<
        TReduxModuleTypeContainer,
        ReduxModuleTypeContainer<
          'recording',
          RecordingStoreState<TReduxModuleTypeContainer['_actionType']>['recording'],
          undefined,
          undefined,
          undefined
        >
      >
    : TReduxModuleTypeContainer
> = (TReduxModuleStoreOptions['deferred'] extends true
  ? ReloadableStore<TReduxModuleFinal>
  : {}) &
  ReduxModuleStore<TReduxModuleFinal>;
