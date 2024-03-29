import {
  Action,
  applyMiddleware,
  combineReducers,
  compose,
  createStore,
  Middleware,
  MiddlewareAPI,
  PreloadedState,
  Reducer,
  ReducersMapObject,
} from 'redux';
import { wrapInPath, mergeDeep } from '../utils';
import thunk, { ThunkDispatch } from 'redux-thunk';
import { ReloadableStoreImpl } from './reloadable-store-impl';
import {
  ReduxModule,
  ReduxModuleTypeContainerStoreState,
  ReduxModuleRequiresInitialization,
  ReduxModuleFullyInitialized,
  ReduxModuleMayRequireInitialization,
  ProvidedModuleProps,
  ReduxModuleTypeContainerNameOnly,
  ReduxModuleTypeContainerNameAndPropsOnly,
  ReduxModuleTypeContainerUnnamed,
  Interceptor,
  ReduxModuleTypeContainerWithAction,
  ReduxModuleTypeContainerWithActionCreator,
  ReduxModuleTypeContainerWithProps,
  ReduxModuleTypeContainerAny,
  ReduxModuleTypeContainerWithImportPathsExcluded,
  ReduxModuleBase,
} from '../redux-module';
import { isAction } from '../is-action';
import {
  RecordingModuleMiddleware,
  RecordingModuleStateImpl,
} from './recording-module-state-impl';
import { ActionFromActionCreators } from '../type-helpers';
import { PostConfigure } from '../post-configure';
import { ReduxModuleMiddleware } from '../redux-module-middleware';
import { ReduxModuleStoreOptions } from '../redux-module-store-options';
import { RecordingStoreState } from '../recording-module';
import {
  ModuleInitializer,
  ModuleInitializerPropsType,
} from '../module-initializer';
import { ReduxModuleStore } from '../redux-module-store';
import { ReduxModuleReducer } from '../redux-module-reducer';
import {
  ADD_ACTION_LISTENER,
  REMOVE_ACTION_LISTENER,
} from '../redux-action-listener';
import { StoreFromOptions } from '../store-from-options';

/**
 * Factory function interface for middlewares which accept props.
 */
type MiddlewareFactory<TStoreState, TAction extends Action> = (
  props: any,
  actions: any
) => Middleware<{}, TStoreState, ThunkDispatch<TStoreState, any, TAction>>[];

type StorePendingInitialization = {
  propsInitialized: boolean;
  pendingInitActions: Action[];
};

function getNormalizedActionType(action: Action): string {
  if (action.type.includes('PROBE_UNKNOWN_ACTION')) {
    return 'PROBE_UNKNOWN_ACTION';
  }
  return action.type;
}

const REDUCER_STATE_UNDEFINED = { __reducer_state_undefined: true };
const LOGGING = false;

function runReducer(
  id: string,
  paths: string[],
  state: any,
  initialStoreState: any,
  action: any,
  props: any,
  reducers: ReduxModuleReducer<any>[],
  storePendingInitialization: StorePendingInitialization
): any {
  const defaultState = state || initialStoreState[id];
  if (!storePendingInitialization.propsInitialized) {
    if (LOGGING) {
      console.log('reducer-pending', id, paths, action);
    }
    if (
      storePendingInitialization.pendingInitActions.findIndex(
        (pa) => getNormalizedActionType(pa) === getNormalizedActionType(action)
      ) === -1
    ) {
      storePendingInitialization.pendingInitActions.push(action);
    }
    return defaultState || REDUCER_STATE_UNDEFINED;
  }
  return reducers.reduce((reducedState, reducer) => {
    // If the reducer state is effectively undefined, we want to actually pass undefined
    // to the reducer so default argument values get used
    const reducedStateToUse = reducedState.__reducer_state_undefined
      ? undefined
      : reducedState;
    let newState = reducer(reducedStateToUse, action, props);
    if (LOGGING) {
      console.log(
        'reducer-not-pending-after',
        id,
        paths,
        reducers.length,
        action,
        reducedState,
        reducedStateToUse,
        newState
      );
    }
    if (typeof newState === 'undefined') {
      return REDUCER_STATE_UNDEFINED;
    }
    newState = { ...newState, __reducer_state_undefined: false };
    return newState;
  }, defaultState);
}

class ReduxModuleImplementation<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TName extends string = TReduxModuleTypeContainer['_nameType'],
  TAction extends Action | never = TReduxModuleTypeContainer['_actionType'],
  TActionCreators = TReduxModuleTypeContainer['_actionCreatorType'],
  TProps = TReduxModuleTypeContainer['_initializerPropsType'],
  TStoreState = ReduxModuleTypeContainerStoreState<TReduxModuleTypeContainer>,
  TReduxModuleTypeContainerWithImportPathsExcluded extends ReduxModuleTypeContainerWithImportPathsExcluded<TReduxModuleTypeContainer> = ReduxModuleTypeContainerWithImportPathsExcluded<TReduxModuleTypeContainer>
> implements
    ReduxModule<TReduxModuleTypeContainer>,
    ReduxModuleRequiresInitialization<TReduxModuleTypeContainer>,
    ReduxModuleFullyInitialized<TReduxModuleTypeContainer>
{
  public readonly name: TName;
  public readonly path: string[];
  public readonly actions: Readonly<any>;
  public readonly _types: TReduxModuleTypeContainerWithImportPathsExcluded;
  private combinedModules: Readonly<ReduxModuleBase<any>[]>;
  constructor(
    private readonly rawPath: string,
    actions: any,
    private readonly reducer: ReduxModuleReducer<TReduxModuleTypeContainer>,
    private readonly middlewareFactory: MiddlewareFactory<TStoreState, TAction>,
    private readonly _preloadedState: any,
    private readonly postConfigure: PostConfigure<TReduxModuleTypeContainer>,
    private readonly propsInitializer: (inProps: any) => any,
    private readonly providedProps: ProvidedModuleProps<
      TReduxModuleTypeContainer,
      TReduxModuleTypeContainer['_initializerPropsType']
    >,
    combinedModules: ReduxModuleBase<any>[]
  ) {
    this.path = nameToPath(rawPath);
    this.name = [...this.path].pop() as TName;
    if (!Object.isFrozen(actions)) {
      // ensure action creator has 'this' when destructured
      Object.keys(actions).forEach((actionCreatorName) => {
        actions[actionCreatorName] = actions[actionCreatorName].bind(actions);
      });
    }
    this.actions = Object.freeze(actions);
    if (!this.reducer) {
      this.reducer = (state) => state;
    }
    this.combinedModules = combinedModules || [];
  }
  public get modules() {
    const mods: any = {};
    this.combinedModules.forEach((mod) => {
      mergeDeep(mods, wrapInPath(mod, mod.path));
    });
    return mods;
  }
  public configure(
    configure: PostConfigure<TReduxModuleTypeContainer>
  ): ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer> {
    return new ReduxModuleImplementation(
      this.rawPath,
      this.actions,
      this.reducer,
      this.middlewareFactory,
      this._preloadedState,
      configure,
      this.propsInitializer,
      this.providedProps,
      this.combinedModules.slice()
    );
  }
  public reduce(reducer: ReduxModuleReducer<TReduxModuleTypeContainer>) {
    return new ReduxModuleImplementation(
      this.rawPath,
      this.actions,
      reducer,
      this.middlewareFactory,
      this._preloadedState,
      this.postConfigure,
      this.propsInitializer,
      this.providedProps,
      this.combinedModules.slice()
    ) as any;
  }
  public preloadedState(preloadedState: any) {
    return new ReduxModuleImplementation(
      this.rawPath,
      this.actions,
      this.reducer,
      this.middlewareFactory,
      preloadedState,
      this.postConfigure,
      this.propsInitializer,
      this.providedProps,
      this.combinedModules.slice()
    ) as any;
  }
  public on(
    typeOrHandler:
      | string
      | ((...store: any) => (...next: any) => (action: any) => void),
    handler?: (...store: any) => (...next: any) => (action: any) => void
  ) {
    let check: (action: Action) => boolean = null;
    if (typeof typeOrHandler === 'function') {
      // first arg is the handler
      handler =
        typeOrHandler as ReduxModuleMiddleware<TReduxModuleTypeContainer>;
    } else {
      // set check function to validate that the supplied
      // type pattern matches the action
      check = (action) => isAction(action, typeOrHandler);
    }
    if (check) {
      // Only apply the check if
      const origHandler = handler;
      handler = (store) => (next) => (action) => {
        if (check(action)) {
          origHandler(store)(next)(action);
        } else {
          next(action);
        }
      };
    }
    // create wrapper middleware to pass module actions in middleware API
    const currentMiddlewareFactory: MiddlewareFactory<TStoreState, TAction> =
      this.middlewareFactory || (() => []);
    const newMiddlewareFactory: MiddlewareFactory<TStoreState, TAction> = (
      props: any,
      actions: any
    ) => {
      const wrapped: Middleware = (store) => (next) => (action) => {
        const middlewareApiWithActions: MiddlewareAPI & {
          actions: TActionCreators;
          props: TProps;
        } = {
          dispatch: store.dispatch,
          getState: store.getState,
          actions,
          props,
        };
        handler(middlewareApiWithActions)(next)(action);
      };
      return [...currentMiddlewareFactory(props, actions), wrapped];
    };
    return new ReduxModuleImplementation(
      this.rawPath,
      this.actions,
      this.reducer,
      newMiddlewareFactory,
      this._preloadedState,
      this.postConfigure,
      this.propsInitializer,
      this.providedProps,
      this.combinedModules.slice()
    ) as any;
  }

  public intercept(interceptor: Interceptor<any, any, any, any>) {
    return this.on((store) => (next) => (action) => {
      let shouldCancelInterceptedAction = false;
      const result = interceptor(action, {
        actions: store.actions,
        state: store.getState(),
        props: store.props,
        cancelInterceptedAction: () => {
          shouldCancelInterceptedAction = true;
        },
      });
      if (!shouldCancelInterceptedAction) {
        next(action);
      }
      if (result) {
        (Array.isArray(result) ? result : [result])
          .filter((item) => item)
          .forEach((action) => store.dispatch(action));
      }
    });
  }

  public with(module: ReduxModuleBase<any>) {
    this.combinedModules = this.combinedModules.filter(
      (m) => nameToPath(m.name).join() !== nameToPath(module.name).join()
    );
    const currentPropsInitializer = this.propsInitializer;
    const newPropsInitializer = (props: any) => {
      return {
        ...currentPropsInitializer(props),
        ...(module as any).propsInitializer(props),
      };
    };
    return new ReduxModuleImplementation(
      this.rawPath,
      this.actions,
      this.reducer,
      this.middlewareFactory,
      this._preloadedState,
      this.postConfigure,
      newPropsInitializer,
      this.providedProps,
      [...this.combinedModules, module as any]
    ) as any;
  }

  public import(module: ReduxModuleBase<any>) {
    return this as any;
  }

  public initialize(
    props: ProvidedModuleProps<
      TReduxModuleTypeContainer,
      TReduxModuleTypeContainer['_initializerPropsType']
    >
  ) {
    const existingProvidedProps = this.providedProps;
    const propsToSet: ProvidedModuleProps<
      TReduxModuleTypeContainer,
      TReduxModuleTypeContainer['_initializerPropsType']
    > = (context) => {
      const existing =
        (existingProvidedProps instanceof Function
          ? existingProvidedProps(context)
          : existingProvidedProps) || {};
      const added = (props instanceof Function ? props(context) : props) || {};
      return { ...existing, ...added };
    };
    return new ReduxModuleImplementation(
      this.rawPath,
      this.actions,
      this.reducer,
      this.middlewareFactory,
      this._preloadedState,
      this.postConfigure,
      this.propsInitializer,
      propsToSet,
      this.combinedModules.slice()
    ) as any;
  }

  private collectModules(
    combinedModule: any,
    collected: ReduxModuleImplementation<any, any, any, any, any, any>[]
  ): void {
    if (combinedModule) {
      collected.push(combinedModule);
      for (const mod of combinedModule.combinedModules || []) {
        this.collectModules(mod, collected);
      }
    }
  }

  public getInitializedProps(
    store: StoreFromOptions<
      TReduxModuleTypeContainer,
      ReduxModuleStoreOptions<
        ReduxModuleTypeContainerStoreState<TReduxModuleTypeContainer>
      >
    >
  ) {
    const providedPropsContext = {
      store,
    };
    return (
      (this.providedProps instanceof Function
        ? this.providedProps(providedPropsContext)
        : this.providedProps) || {}
    );
  }

  public getCombinedActionCreators() {
    const modules: ReduxModuleImplementation<any, any, any, any, any, any>[] =
      [];
    this.collectModules(this, modules);
    return Object.freeze(
      modules.reduce((creators, module) => {
        return { ...creators, ...wrapInPath(module.actions, module.path) };
      }, {})
    );
  }

  public asStore(options: ReduxModuleStoreOptions<any> = {}): any {
    const storeFactory = (): ReduxModuleStore<TReduxModuleTypeContainer> => {
      const modules: ReduxModuleImplementation<any, any, any, any, any, any>[] =
        [];
      this.collectModules(this, modules);

      const actionCreators = Object.freeze(
        modules.reduce((creators, module) => {
          return { ...creators, ...wrapInPath(module.actions, module.path) };
        }, {})
      );

      if (options.record) {
        modules.unshift(
          createModule('recording')
            .preloadedState(
              new RecordingModuleStateImpl<TAction>() as RecordingStoreState<TAction>['recording']
            )
            .on(RecordingModuleMiddleware())
            .reduce(
              (
                state: RecordingStoreState<TAction>['recording'],
                action: TAction
              ) => {
                state.actions.push(action);
                return state;
              }
            ) as any
        );
      }

      const actionListeners = [];
      modules.unshift(
        createModule('_action_listener')
          .preloadedState({ listeners: [] })
          .intercept((action, context) => {
            if (action.type === ADD_ACTION_LISTENER) {
              actionListeners.push((action as any).listener);
            } else if (action.type === REMOVE_ACTION_LISTENER) {
              const idx = actionListeners.indexOf((action as any).listener);
              if (idx > -1) {
                actionListeners.splice(idx, 1);
              }
            } else {
              for (const listener of actionListeners) {
                listener(action, context);
              }
            }
          }) as any
      );

      // Module paths which by reducer group key
      const reducerGroupPaths: Record<string, string[]> = {};

      // Group reducers based on top-level module key
      const reducerGroups: Record<string, Reducer[]> = modules
        .filter((module) => module.reducer)
        .reduce((reducers, module) => {
          let reducerToAdd = module.reducer;
          const reducerGroupKey = module.path[0];
          reducers[reducerGroupKey] = reducers[reducerGroupKey] || [];
          reducerGroupPaths[reducerGroupKey] =
            reducerGroupPaths[reducerGroupKey] || [];
          if (!reducerGroupPaths[reducerGroupKey].includes(module.rawPath)) {
            reducerGroupPaths[reducerGroupKey].push(module.rawPath);
          }
          if (module.path.length > 1) {
            // remove root key as redux already accounts for this
            const modulePathMinusRootKey = module.path.slice();
            modulePathMinusRootKey.shift();
            // create reducer that operates on nested state
            reducerToAdd = (state, action, combinedPropsForReducer) => {
              const reducerPath = modulePathMinusRootKey.slice();
              let stateOutput = state;
              while (state && reducerPath.length > 0) {
                const k = reducerPath.shift();
                state = state[k];
              }
              let result = module.reducer(
                state,
                action,
                combinedPropsForReducer
              );
              if (result) {
                return mergeDeep(
                  stateOutput || {},
                  wrapInPath(result, modulePathMinusRootKey.slice())
                );
              }
              return stateOutput;
            };
          }
          reducers[reducerGroupKey].push(reducerToAdd);
          return reducers;
        }, {});

      // prepare preloaded store state from individual module state
      const initialStoreState = mergeDeep(
        modules
          .filter((module) => module._preloadedState)
          .reduce(
            (initialStoreState, module) =>
              mergeDeep(
                initialStoreState,
                wrapInPath(module._preloadedState, module.path)
              ),
            {}
          ),
        options.preloadedState || {}
      );

      const initializedProps = {};
      const storePendingInitialization: StorePendingInitialization = {
        propsInitialized: false,
        pendingInitActions: [],
      };

      // build store
      const reducers = combineReducers<TStoreState>(
        Object.keys(reducerGroups).reduce((reducers, key) => {
          reducers[key] = (state: any, action: any) => {
            return runReducer(
              key,
              reducerGroupPaths[key],
              state,
              initialStoreState,
              action,
              initializedProps,
              reducerGroups[key],
              storePendingInitialization
            );
          };
          return reducers;
        }, {}) as ReducersMapObject<TStoreState, any>
      );
      const middlewares: any[] = modules.reduce(
        (middlewares, module) => {
          if (module.middlewareFactory) {
            // need to pass props here, because they have not been initialized when the middleware is defined
            middlewares.push(
              ...(module
                .middlewareFactory(
                  initializedProps,
                  Object.freeze({
                    ...actionCreators,
                    ...module.actions,
                  })
                )
                .map((moduleMiddleware) => {
                  return moduleMiddleware;
                }) as any)
            );
          }
          return middlewares;
        },
        [thunk]
      );
      if (options.enforceImmutableState) {
        middlewares.unshift(
          require('redux-immutable-state-invariant').default({
            ignore: options.record ? ['recording'] : [],
          })
        );
      }

      let composeEnhancers = compose;
      if (options.enableReduxDevTools && typeof window !== 'undefined') {
        composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
          ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
          : compose;
      }

      const store: ReduxModuleStore<TReduxModuleTypeContainer> = createStore<
        TStoreState,
        TAction,
        any,
        any
      >(
        reducers,
        initialStoreState as PreloadedState<TStoreState>,
        composeEnhancers(applyMiddleware(...middlewares))
      );
      // expose action creators from all of the modules on the store
      (store as any).actions = actionCreators;
      (store as any).module = this;

      const providedPropsContext = {
        store,
      };

      const combinedModulesInitializedProps = modules.reduce(
        (combined, module) => {
          return { ...combined, ...module.getInitializedProps(store) };
        },
        {}
      );
      (store as any).props = Object.assign(
        initializedProps,
        this.propsInitializer({
          ...combinedModulesInitializedProps,
          ...((this.providedProps instanceof Function
            ? this.providedProps(providedPropsContext)
            : this.providedProps) || {}),
        })
      );
      Object.freeze((store as any).props);

      // run post configure functions
      modules.forEach((module) => {
        if (module.postConfigure) {
          module.postConfigure(store as any);
        }
      });

      // Run deferred/pending actions now that props are initialized
      if (!storePendingInitialization.propsInitialized) {
        storePendingInitialization.propsInitialized = true;
        while (storePendingInitialization.pendingInitActions.length > 0) {
          const initAction =
            storePendingInitialization.pendingInitActions.shift();
          try {
            store.dispatch(initAction);
          } catch (err) {
            if (!/^A state mutation was/.test(err.message)) {
              throw err;
            }
          }
        }
      }

      return store;
    };
    const reloadableStore: ReloadableStoreImpl<TReduxModuleTypeContainer> =
      new ReloadableStoreImpl<TReduxModuleTypeContainer>(
        this as any,
        storeFactory
      );
    if (!options.deferred) {
      reloadableStore.reload();
    }
    return reloadableStore;
  }
}

function nameToPath(name: string): string[] {
  return name.split(/\.|\/|->/g);
}

/**
 * Creates a named module with initializer and actionCreators.
 * @param name
 * @param options
 */
export function createModule<
  TPath extends string,
  TInitializer extends ModuleInitializer<any>,
  TActionCreators extends Record<string, (...args: any) => Action>,
  TActionFromActionCreators extends ActionFromActionCreators<TActionCreators>,
  TProps = ModuleInitializerPropsType<TInitializer>
>(
  name: TPath,
  options: {
    initializer: TInitializer;
    actionCreators: TActionCreators;
  }
): ReduxModuleMayRequireInitialization<
  ReduxModuleTypeContainerWithProps<
    ReduxModuleTypeContainerWithActionCreator<
      ReduxModuleTypeContainerWithAction<
        ReduxModuleTypeContainerNameOnly<TPath>,
        TActionFromActionCreators
      >,
      TActionCreators
    >,
    TProps
  >
>;
/**
 * Creates a named module with initializer.
 * @param name
 * @param options
 */
export function createModule<
  TPath extends string,
  TInitializer extends ModuleInitializer<any>,
  TProps = ModuleInitializerPropsType<TInitializer>
>(
  name: TPath,
  options: {
    initializer: TInitializer;
  }
): ReduxModuleMayRequireInitialization<
  ReduxModuleTypeContainerNameAndPropsOnly<TPath, TProps>
>;
/**
 * Creates a named module with actionCreators.
 * @param name
 * @param options
 */
export function createModule<
  TPath extends string,
  TActionCreators extends Record<string, (...args: any) => Action>,
  TActionFromActionCreators extends Action = ActionFromActionCreators<TActionCreators>
>(
  name: TPath,
  options: {
    actionCreators: TActionCreators;
  }
): ReduxModuleMayRequireInitialization<
  ReduxModuleTypeContainerWithActionCreator<
    ReduxModuleTypeContainerWithAction<
      ReduxModuleTypeContainerNameOnly<TPath>,
      TActionFromActionCreators
    >,
    TActionCreators
  >
>;
/**
 * Creates a named module without options.
 * @param name
 */
export function createModule<TPath extends string>(
  name: TPath
): ReduxModuleFullyInitialized<ReduxModuleTypeContainerNameOnly<TPath>>;
/**
 * Creates an unamed module with initialize and actionCreators.
 * @param options
 */
export function createModule<
  TInitializer extends ModuleInitializer<any>,
  TActionCreators extends Record<string, (...args: any) => Action>,
  TActionFromActionCreators extends Action = ActionFromActionCreators<TActionCreators>,
  TProps = ModuleInitializerPropsType<TInitializer>
>(options: {
  initializer: TInitializer;
  actionCreators: TActionCreators;
}): ReduxModuleMayRequireInitialization<
  ReduxModuleTypeContainerWithActionCreator<
    ReduxModuleTypeContainerWithAction<
      ReduxModuleTypeContainerNameAndPropsOnly<'_', TProps>,
      TActionFromActionCreators
    >,
    TActionCreators
  >
>;
/**
 * Creates an unamed module with initialize.
 * @param options
 */
export function createModule<
  TInitializer extends ModuleInitializer<any>,
  TProps = ModuleInitializerPropsType<TInitializer>
>(options: {
  initializer: TInitializer;
}): ReduxModuleMayRequireInitialization<
  ReduxModuleTypeContainerWithProps<ReduxModuleTypeContainerUnnamed, TProps>
>;
/**
 * Creates an unamed module with action creators.
 * @param options
 */
export function createModule<
  TActionCreators extends Record<string, (...args: any) => Action>,
  TActionFromActionCreators extends Action = ActionFromActionCreators<TActionCreators>
>(options: {
  actionCreators: TActionCreators;
}): ReduxModuleMayRequireInitialization<
  ReduxModuleTypeContainerWithActionCreator<
    ReduxModuleTypeContainerWithAction<
      ReduxModuleTypeContainerUnnamed,
      TActionFromActionCreators
    >,
    TActionCreators
  >
>;
/**
 * Creates an unamed module without options.
 */
export function createModule(): ReduxModuleFullyInitialized<ReduxModuleTypeContainerUnnamed>;
/**
 * createModule implementation
 * @param nameOrOptions
 * @param options
 * @returns
 */
export function createModule(nameOrOptions?: string | any, options?: any): any {
  let name: string = '_';
  if (typeof nameOrOptions === 'string') {
    name = nameOrOptions;
  } else {
    options = nameOrOptions;
  }
  return new ReduxModuleImplementation(
    name, // name
    options?.actionCreators || {}, // actionCreators
    null, // reducer
    null, // middleware
    null, // preloadedState
    null, // postConfigure
    options?.initializer || ((props) => props), // propsInitializer
    null, // props
    [] // combined modules
  );
}
