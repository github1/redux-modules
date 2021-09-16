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
  ReduxModuleRequiresInitialization,
  ReduxModuleFullyInitialized,
  ReduxModuleMayRequireInitialization,
  ProvidedModuleProps,
  ReduxModuleAny,
  ReduxModuleTypeContainer,
  ReduxModuleNameOnly,
  ReduxModuleNameAndInitializerOnly,
  ReduxModuleUnamed,
  ReduxModuleTypeContainerWithInitializationPropsProvided,
  Interceptor,
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

/**
 * Factory function interface for middlewares which accept props.
 */
type MiddlewareFactory<TStoreState, TAction extends Action> = (
  props: any
) => Middleware<{}, TStoreState, ThunkDispatch<TStoreState, any, TAction>>[];

function runReducer(
  id: string,
  state: any,
  initialStoreState: any,
  action: any,
  props: any,
  reducers: ReduxModuleReducer<any>[]
): any {
  return reducers.reduce((reducedState, reducer) => {
    const newState = reducer(reducedState, action, props);
    return newState === undefined ? {} : newState;
  }, state || initialStoreState[id]);
}

class ReduxModuleImplementation<
  TReduxModuleTypeContainer extends ReduxModuleAny,
  TName extends string = TReduxModuleTypeContainer['_nameType'],
  TAction extends Action | never = TReduxModuleTypeContainer['_actionType'],
  TActionCreators = TReduxModuleTypeContainer['_actionCreatorType'],
  TInitializer = TReduxModuleTypeContainer['_initializerType'],
  TStoreState = TReduxModuleTypeContainer['_storeStateType']
> implements
    ReduxModule<TReduxModuleTypeContainer>,
    ReduxModuleRequiresInitialization<TReduxModuleTypeContainer>,
    ReduxModuleFullyInitialized<TReduxModuleTypeContainer>
{
  public readonly _types: TReduxModuleTypeContainer;
  public readonly actions: Readonly<any>;
  private combinedModules: Readonly<ReduxModule<any>[]>;
  constructor(
    public readonly name: TName,
    actions: any,
    private reducer: ReduxModuleReducer<TReduxModuleTypeContainer>,
    private middlewareFactory: MiddlewareFactory<TStoreState, TAction>,
    private _preloadedState: any,
    private postConfigure: PostConfigure<TReduxModuleTypeContainer>,
    private propsInitializer: (inProps: any) => any,
    private providedProps: ProvidedModuleProps<TInitializer>,
    combinedModules: ReduxModule<any>[]
  ) {
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
  public get path() {
    return this.nameToPath(this.name);
  }
  public configure(configure: PostConfigure<TReduxModuleTypeContainer>) {
    return new ReduxModuleImplementation(
      this.name,
      this.actions,
      this.reducer,
      this.middlewareFactory,
      this._preloadedState,
      configure,
      this.propsInitializer,
      this.providedProps,
      this.combinedModules.slice()
    ) as any;
  }
  public reduce(reducer: ReduxModuleReducer<TReduxModuleTypeContainer>) {
    return new ReduxModuleImplementation(
      this.name,
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
      this.name,
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
      props: any
    ) => {
      const wrapped: Middleware = (store) => (next) => (action) => {
        const middlewareApiWithActions: MiddlewareAPI & {
          actions: TActionCreators;
          props: ModuleInitializerPropsType<TInitializer>;
        } = {
          dispatch: store.dispatch,
          getState: store.getState,
          actions: this.actions,
          props,
        };
        handler(middlewareApiWithActions)(next)(action);
      };
      return [...currentMiddlewareFactory(props), wrapped];
    };
    return new ReduxModuleImplementation(
      this.name,
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
      next(action);
      const result = interceptor(action, {
        actions: store.actions,
        state: store.getState(),
        props: store.props,
      });
      if (result) {
        (Array.isArray(result) ? result : [result])
          .filter((item) => item)
          .forEach((action) => store.dispatch(action));
      }
    });
  }

  public with(module: ReduxModule<any>) {
    this.combinedModules = this.combinedModules.filter(
      (m) =>
        this.nameToPath(m.name).join() !== this.nameToPath(module.name).join()
    );
    const currentPropsInitializer = this.propsInitializer;
    const newPropsInitializer = (props: any) => {
      return {
        ...currentPropsInitializer(props),
        ...(module as any).propsInitializer(props),
      };
    };
    return new ReduxModuleImplementation(
      this.name,
      this.actions,
      this.reducer,
      this.middlewareFactory,
      this._preloadedState,
      this.postConfigure,
      newPropsInitializer,
      this.providedProps,
      [...this.combinedModules, module]
    ) as any;
  }

  public initialize(
    props: ProvidedModuleProps<TInitializer>
  ): ReduxModuleFullyInitialized<
    ReduxModuleTypeContainerWithInitializationPropsProvided<TReduxModuleTypeContainer>
  > {
    return new ReduxModuleImplementation(
      this.name,
      this.actions,
      this.reducer,
      this.middlewareFactory,
      this._preloadedState,
      this.postConfigure,
      this.propsInitializer,
      props,
      this.combinedModules.slice()
    );
  }

  public asStore(options: ReduxModuleStoreOptions<TStoreState> = {}): any {
    const storeFactory = (): ReduxModuleStore<TReduxModuleTypeContainer> => {
      const initializedProps = Object.freeze(
        this.propsInitializer(
          (this.providedProps instanceof Function
            ? this.providedProps()
            : this.providedProps) || {}
        )
      );

      const modules: ReduxModuleImplementation<any, any, any, any, any, any>[] =
        [this, ...(this.combinedModules as any)];
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

      // Group reducers based on top-level module key
      const reducerGroups: { [key: string]: Reducer[] } = modules
        .filter((module) => module.reducer)
        .reduce((reducers, module) => {
          let reducerToAdd = module.reducer;
          const reducerGroupKey = module.path[0];
          reducers[reducerGroupKey] = reducers[reducerGroupKey] || [];
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
              if (result && stateOutput) {
                return mergeDeep(
                  stateOutput,
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

      // build store
      const reducers = combineReducers<TStoreState>(
        Object.keys(reducerGroups).reduce((reducers, key) => {
          reducers[key] = (state: any, action: any) =>
            runReducer(
              key,
              state,
              initialStoreState,
              action,
              initializedProps,
              reducerGroups[key]
            );
          return reducers;
        }, {}) as ReducersMapObject<TStoreState, any>
      );
      const middlewares: any[] = modules.reduce(
        (middlewares, module) => {
          if (module.middlewareFactory) {
            // need to pass props here, because they have not been initialized when the middleware is defined
            middlewares.push(
              ...(module
                .middlewareFactory(initializedProps)
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
      (store as any).actions = modules.reduce((creators, module) => {
        return { ...creators, ...wrapInPath(module.actions, module.path) };
      }, {});
      (store as any).props = initializedProps;

      // run post configure functions
      modules.forEach((module) => {
        if (module.postConfigure) {
          module.postConfigure(store);
        }
      });

      return store;
    };
    if (options.deferred) {
      return new ReloadableStoreImpl<TReduxModuleTypeContainer>(storeFactory);
    }
    return storeFactory();
  }

  private nameToPath(name: string): string[] {
    return name.split(/\.|\/|->/g);
  }
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
  TActionFromActionCreators extends Action = ActionFromActionCreators<TActionCreators>
>(
  name: TPath,
  options: {
    initializer: TInitializer;
    actionCreators: TActionCreators;
  }
): ReduxModuleMayRequireInitialization<
  ReduxModuleTypeContainer<
    TPath,
    unknown,
    TActionFromActionCreators,
    TActionCreators,
    TInitializer,
    unknown
  >
>;
/**
 * Creates a named module with initializer.
 * @param name
 * @param options
 */
export function createModule<
  TPath extends string,
  TInitializer extends ModuleInitializer<any>
>(
  name: TPath,
  options: {
    initializer: TInitializer;
  }
): ReduxModuleMayRequireInitialization<
  ReduxModuleNameAndInitializerOnly<TPath, TInitializer>
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
  ReduxModuleTypeContainer<
    TPath,
    unknown,
    TActionFromActionCreators,
    TActionCreators,
    undefined,
    unknown
  >
>;
/**
 * Creates a named module without options.
 * @param name
 */
export function createModule<TPath extends string>(
  name: TPath
): ReduxModuleFullyInitialized<ReduxModuleNameOnly<TPath>>;
/**
 * Creates an unamed module with initialize and actionCreators.
 * @param options
 */
export function createModule<
  TInitializer extends ModuleInitializer<any>,
  TActionCreators extends Record<string, (...args: any) => Action>,
  TActionFromActionCreators extends Action = ActionFromActionCreators<TActionCreators>
>(options: {
  initializer: TInitializer;
  actionCreators: TActionCreators;
}): ReduxModuleMayRequireInitialization<
  ReduxModuleTypeContainer<
    '_',
    unknown,
    TActionFromActionCreators,
    TActionCreators,
    TInitializer,
    unknown
  >
>;
/**
 * Creates an unamed module with initialize.
 * @param options
 */
export function createModule<
  TInitializer extends ModuleInitializer<any>
>(options: {
  initializer: TInitializer;
}): ReduxModuleMayRequireInitialization<
  ReduxModuleTypeContainer<
    '_',
    unknown,
    unknown,
    unknown,
    TInitializer,
    unknown
  >
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
  ReduxModuleTypeContainer<
    '_',
    unknown,
    TActionFromActionCreators,
    TActionCreators,
    undefined,
    unknown
  >
>;
/**
 * Creates an unamed module without options.
 */
export function createModule(): ReduxModuleFullyInitialized<ReduxModuleUnamed>;
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
