import { ReduxModuleAny } from '.';
import { ReduxModuleStore } from './redux-module-store';

export type PostConfigure<TReduxModule extends ReduxModuleAny> = (
  store: ReduxModuleStore<TReduxModule>
) => void;
