import { Action, Dispatch, Observable, Reducer, Unsubscribe } from 'redux';
import {
  ReduxModule,
  ReduxModuleTypeContainerAny,
  ReduxModuleTypeContainerStoreState,
  ReduxModuleTypeContainerStoreActionCreator,
} from '../redux-module';
import { ReduxModuleStore } from '../redux-module-store';
import { ReloadableStore } from '../reloadable-store';

export class ReloadableStoreImpl<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TAction extends Action | never = TReduxModuleTypeContainer['_actionType'],
  TActionCreatorsInStore extends ReduxModuleTypeContainerStoreActionCreator<TReduxModuleTypeContainer> = ReduxModuleTypeContainerStoreActionCreator<TReduxModuleTypeContainer>,
  TInitializerPropTypes extends Required<
    TReduxModuleTypeContainer['_initializerPropsType']
  > = Required<TReduxModuleTypeContainer['_initializerPropsType']>,
  TStoreState extends ReduxModuleTypeContainerStoreState<TReduxModuleTypeContainer> = ReduxModuleTypeContainerStoreState<TReduxModuleTypeContainer>
> implements ReloadableStore<TReduxModuleTypeContainer>
{
  private _store: ReduxModuleStore<TReduxModuleTypeContainer>;
  constructor(
    public readonly module: ReduxModule<TReduxModuleTypeContainer>,
    private readonly factory: () => ReduxModuleStore<TReduxModuleTypeContainer>
  ) {}
  reload(): ReloadableStore<TReduxModuleTypeContainer> {
    this._store = this.factory();
    return this;
  }
  get dispatch(): Dispatch<Extract<TAction, Action>> {
    return this.store.dispatch;
  }
  get actions(): Readonly<TActionCreatorsInStore> {
    return this.store.actions as any;
  }
  get props(): Readonly<TInitializerPropTypes> {
    return this.store.props as any;
  }
  getState(): TStoreState {
    return this.store.getState() as any;
  }
  subscribe(listener: () => void): Unsubscribe {
    return this.store.subscribe(listener);
  }
  replaceReducer(
    nextReducer: Reducer<TStoreState, Extract<TAction, Action>>
  ): void {
    this.store.replaceReducer(nextReducer);
  }
  [Symbol.observable](): Observable<TStoreState> {
    return this.store[Symbol.observable]();
  }
  private get store(): ReduxModuleStore<TReduxModuleTypeContainer> {
    if (!this._store) {
      this.reload();
    }
    return this._store;
  }
}
