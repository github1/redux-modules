import { ReduxModuleTypeContainerAny } from './redux-module';

export type ReduxModuleReducer<TReduxModule extends ReduxModuleTypeContainerAny> = (
  state: TReduxModule['_stateType'],
  action: TReduxModule['_actionType'],
  props: Readonly<TReduxModule['_initializerRequiredPropsType']>
) => TReduxModule['_stateType'];
