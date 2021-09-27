import { ReduxModuleTypeContainerAny } from './redux-module';

export type ReduxModuleReducer<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> = (
  state: TReduxModuleTypeContainer['_stateType'],
  action: TReduxModuleTypeContainer['_actionType'],
  props: Readonly<Required<TReduxModuleTypeContainer['_initializerPropsType']>>
) => TReduxModuleTypeContainer['_stateType'];
