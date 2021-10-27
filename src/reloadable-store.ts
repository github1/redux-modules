import { Action } from 'redux';
import { ReduxModuleTypeContainerAny } from './redux-module';
import { ReduxModuleStore } from './redux-module-store';

export interface ReloadableStore<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> extends ReduxModuleStore<TReduxModuleTypeContainer> {
  reload(): ReloadableStore<TReduxModuleTypeContainer>;
}

export interface ReduxActionListener {
  (action: Action): void;
}

export interface ReduxActionTarget {
  addActionListener(listener: ReduxActionListener): void;
  removeActionListener(listener: ReduxActionListener): void;
}
