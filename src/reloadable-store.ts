import { ReduxModuleAny } from './redux-module';
import { ReduxModuleStore } from './redux-module-store';

export interface ReloadableStore<TReduxModule extends ReduxModuleAny>
  extends ReduxModuleStore<TReduxModule> {
  reload(): ReloadableStore<TReduxModule>;
}
