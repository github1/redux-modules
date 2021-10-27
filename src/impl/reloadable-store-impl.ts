import { Action, Dispatch, Observable, Reducer, Unsubscribe } from 'redux';
import {
  ReduxModule,
  ReduxModuleTypeContainerAny,
  ReduxModuleTypeContainerStoreState,
  ReduxModuleTypeContainerStoreActionCreator,
} from '../redux-module';
import { ReduxModuleStore } from '../redux-module-store';
import {
  ReduxActionListener,
  ReduxActionTarget,
  ReloadableStore,
} from '../reloadable-store';

export class ReloadableStoreImpl<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TAction extends Action | never = TReduxModuleTypeContainer['_actionType'],
  TActionCreatorsInStore extends ReduxModuleTypeContainerStoreActionCreator<TReduxModuleTypeContainer> = ReduxModuleTypeContainerStoreActionCreator<TReduxModuleTypeContainer>,
  TInitializerPropTypes extends Required<
    TReduxModuleTypeContainer['_initializerPropsType']
  > = Required<TReduxModuleTypeContainer['_initializerPropsType']>,
  TStoreState extends ReduxModuleTypeContainerStoreState<TReduxModuleTypeContainer> = ReduxModuleTypeContainerStoreState<TReduxModuleTypeContainer>
> implements ReloadableStore<TReduxModuleTypeContainer>, ReduxActionTarget
{
  private _store: ReduxModuleStore<TReduxModuleTypeContainer>;
  private _listeners: ReduxActionListener[] = [];
  constructor(
    public readonly module: ReduxModule<TReduxModuleTypeContainer>,
    private readonly factory: () => ReduxModuleStore<TReduxModuleTypeContainer>
  ) {}
  addActionListener(listener: ReduxActionListener) {
    this._listeners.push(listener);
  }
  removeActionListener(listener: ReduxActionListener) {
    const idx = this._listeners.indexOf(listener);
    if (idx > -1) {
      this._listeners.splice(idx, 1);
    }
  }
  reload(): ReloadableStore<TReduxModuleTypeContainer> {
    this._store = this.factory();
    return this;
  }
  get dispatch(): Dispatch<Extract<TAction, Action>> {
    return (action) => {
      const res = this.store.dispatch(action);
      for (const listener of this._listeners) {
        listener(action);
      }
      return res;
    };
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
