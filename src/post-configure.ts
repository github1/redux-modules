import { ReduxModuleTypeContainerAny } from '.';
import { ReduxModuleStore } from './redux-module-store';

export type PostConfigure<TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny> = (
  store: ReduxModuleStore<TReduxModuleTypeContainer>
) => void;
