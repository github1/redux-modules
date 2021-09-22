import { ReduxModuleTypeContainerAny } from './redux-module';
import { ReduxModuleStore } from './redux-module-store';

export interface ReloadableStore<TReduxModule extends ReduxModuleTypeContainerAny>
  extends ReduxModuleStore<TReduxModule> {
  reload(): ReloadableStore<TReduxModule>;
}
