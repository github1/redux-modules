import { ReduxModuleTypeContainerAny } from './redux-module';
import { ReduxModuleStore } from './redux-module-store';

export interface ReloadableStore<TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny>
  extends ReduxModuleStore<TReduxModuleTypeContainer> {
  reload(): ReloadableStore<TReduxModuleTypeContainer>;
}
