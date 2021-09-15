import { RecursivePartial } from './utils';

export interface ReduxModuleStoreOptions<TStoreState> {
  deferred?: boolean;
  record?: boolean;
  enforceImmutableState?: boolean;
  enableReduxDevTools?: boolean;
  preloadedState?: RecursivePartial<TStoreState>;
}
