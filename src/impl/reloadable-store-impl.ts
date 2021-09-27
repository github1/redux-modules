import { Action, Dispatch, Observable, Reducer, Unsubscribe } from 'redux';
import {
  ReduxModule,
  ReduxModuleTypeContainerAny,
  ReduxModuleTypeContainerStoreState,
} from '../redux-module';
import { ReduxModuleStore } from '../redux-module-store';
import { ReloadableStore } from '../reloadable-store';

export class ReloadableStoreImpl<
  TReduxModule extends ReduxModuleTypeContainerAny,
  TAction extends Action | never = TReduxModule['_actionType'],
  TActionCreatorsInStore = TReduxModule['_storeActionCreatorsType'],
  TInitializerPropTypes = Required<TReduxModule['_initializerPropsType']>,
  TStoreState = ReduxModuleTypeContainerStoreState<TReduxModule>
> implements ReloadableStore<TReduxModule>
{
  private _store: ReduxModuleStore<TReduxModule>;
  constructor(
    public readonly module: ReduxModule<TReduxModule>,
    private readonly factory: () => ReduxModuleStore<TReduxModule>
  ) {}
  reload(): ReloadableStore<TReduxModule> {
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
  private get store(): ReduxModuleStore<TReduxModule> {
    if (!this._store) {
      this.reload();
    }
    return this._store;
  }
}
