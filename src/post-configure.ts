import { ReduxModuleTypeContainerAny } from '.';
import { ReduxModuleStore } from './redux-module-store';

export type PostConfigure<TReduxModule extends ReduxModuleTypeContainerAny> = (
  store: ReduxModuleStore<TReduxModule>
) => void;
