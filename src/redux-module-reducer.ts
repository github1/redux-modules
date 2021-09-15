import { ReduxModuleAny } from './redux-module';

export type ReduxModuleReducer<TReduxModule extends ReduxModuleAny> = (
  state: TReduxModule['_stateType'],
  action: TReduxModule['_actionType'],
  props: Readonly<TReduxModule['_initializerPropsType']>
) => TReduxModule['_stateType'];
