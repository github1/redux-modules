import {
  Action,
  AnyAction,
  applyMiddleware,
  bindActionCreators,
  combineReducers,
  createStore,
  Dispatch,
  Middleware,
  MiddlewareAPI,
  PreloadedState,
  Reducer,
  ReducersMapObject,
  Store
} from 'redux';
import {connect} from 'react-redux'

const ROOT_MODULE : string = 'root';

interface InterceptorFunction<A extends Action = AnyAction, S = any> {
  (action? : A, state? : S) : any | void;
}

interface ActionHolder {
  action : Action;
}

interface PostConfigure {
  (store : Store) : void;
}

export interface ModuleLike {
  name? : string;
  reducer? : Reducer;
  middleware? : Middleware | Middleware[];
  actions? : {},
  postConfigure? : PostConfigure,
  preloadedState? : any,
  ___m? : boolean;
}

export const connectModule = (connect, module : Module, mapStateToProps = (state) => state) => {
  return connect(
    mapStateToProps || ((state) => state),
    dispatch => bindActionCreators((module as any as { actions : any }).actions, dispatch)
  );
};

const handleUndefinedState = state => state === undefined ? {} : state;

export class Module implements ModuleLike {

  public ___m : boolean;

  public _ : any;

  static RecordingModule() {
    const latestActions : Array<AnyAction> = [];
    return Module.fromReducer('recording', (state = {actions: []}, action) => {
      const newState = JSON.parse(JSON.stringify(state));
      newState.actions.push(action);
      latestActions.push(action);
      newState.containsType = (type) => latestActions.filter(action => action.type === type).length > 0;
      newState.findType = (typeOrFunction, handler?) => {
        const found = latestActions.filter(action => {
          return typeof typeOrFunction === 'function' ? typeOrFunction(action) : action.type === typeOrFunction;
        });
        if (handler) {
          handler(found);
        }
        return found;
      };
      newState.waitForType = (type, timeout = 1000) : Promise<any> => {
        return new Promise((resolve, reject) => {
          const timeoutRef = setTimeout(() => reject(`Exceeded timeout of ${timeout} waiting for ${type}`), timeout);
          const checkForType = () => {
            const found = newState.findType(type);
            if (found.length > 0) {
              clearTimeout(timeoutRef);
              resolve(found);
            } else {
              setTimeout(() => checkForType(), 1);
            }
          };
          checkForType();
        });
      };
      newState.types = newState.actions.map((action, index) => `[${index}] ${action.type}`).join('\n');
      return newState;
    });
  }

  static preloadedState(preloadedState) {
    return new Module(ROOT_MODULE, undefined, undefined, undefined, undefined, preloadedState);
  }

  constructor(public readonly name : string = ROOT_MODULE,
              public readonly reducer? : Reducer,
              public readonly middleware? : Middleware | Middleware[],
              public readonly actions = {},
              public readonly postConfigure? : PostConfigure,
              public readonly preloadedState? : any) {
    if (this.actions) {
      // nothing
    }
    this._ = connectModule(connect, this);
    this.___m = true;
  }

  connect(mapStateToProps?) {
    return connectModule(connect, this, mapStateToProps);
  }

  enforceImmutableState() {
    let newMiddlewares : Middleware[] = [];
    if (this.middleware) {
      if (Array.isArray(this.middleware)) {
        newMiddlewares = this.middleware as Middleware[];
      } else {
        newMiddlewares = [this.middleware];
      }
    }
    newMiddlewares.unshift((require('redux-immutable-state-invariant').default()) as Middleware);
    return new Module(this.name, this.reducer, newMiddlewares, this.actions, this.postConfigure, this.preloadedState);
  }

  inStore(...modules : ModuleLike[]) {
    const concreteModules : Module[] = modules
      .filter(module => module)
      .map(module => isModuleType(module) ? module as Module : Module.create(module));
    concreteModules.unshift(this);
    return Module.createStore(...concreteModules);
  }

  inRecordedStore(...modules : ModuleLike[]) {
    modules.push(Module.RecordingModule() as any as ModuleLike);
    return this.inStore(...modules);
  }

  static create({name, reducer, middleware, actions, postConfigure, preloadedState} : ModuleLike) {
    if (typeof name === 'object') {
      name = Object.keys(name)[0];
    }
    return new Module(name, reducer, middleware, actions, postConfigure, preloadedState);
  }

  static fromMiddleware(middleware : Middleware | Middleware[]) {
    return Module.create({middleware});
  }

  static fromInterceptor(handler : InterceptorFunction) {
    return Module.fromMiddleware(interceptor(handler));
  }

  static fromReducer(name : string | Reducer, reducer? : Reducer) {
    if (typeof name === 'function' && typeof reducer === 'undefined') {
      return Module.create({reducer: name})
    }
    return Module.create({name: (name as string), reducer})
  }

  static createStore<S = any, A extends Action = AnyAction>(...modules : any) : Store<S, A> {
    modules = modules
      .filter(module => module)
      .map(module => isModuleType(module) ? module : Module.preloadedState(module));
    const reducerGroups = modules.reduce((reducers, module) => {
      if (module.reducer) {
        let reducerName = module.name;
        let reducerFunction = module.reducer;
        const nameParts = /([^\/]+)\/(.*)$/.exec(module.name);
        if (nameParts != null) {
          reducerName = nameParts[1];
          const reducerSubField = nameParts[2];
          reducerFunction = (state = {}, action) => {
            const result = module.reducer(state[reducerSubField], action);
            if (result) {
              return {
                ...state,
                [reducerSubField]: typeof result === 'object' ? {
                  ...result
                } : result
              };
            }
            return undefined;
          };
        }
        if (!reducers[reducerName]) {
          reducers[reducerName] = [];
        }
        reducers[reducerName].push(reducerFunction);
      }
      return reducers;
    }, {});
    const reducers = combineReducers<S>(Object.keys(reducerGroups).reduce((reducers, key) => {
      reducers[key] = reducerGroups[key].length === 1 ?
        ((state, action) => handleUndefinedState(reducerGroups[key][0](state, action))) :
        ((state, action) => handleUndefinedState(reducerGroups[key]
          .reduce((reducedState, reducer) => reducer(reducedState, action), state)));
      return reducers;
    }, {}) as ReducersMapObject<S, any>);
    const middlewares = modules.reduce((middlewares, module) => {
      if (module.middleware) {
        if (Array.isArray(module.middleware)) {
          middlewares.push(...module.middleware);
        } else {
          middlewares.push(module.middleware);
        }
      }
      return middlewares;
    }, []);
    const preloadedState = modules.reduce((preloadedState, module) => {
      if (module.preloadedState) {
        preloadedState = setTopLevelKeys(
          module.preloadedState,
          preloadedState, module.name === ROOT_MODULE ? undefined : module.name);
      }
      return preloadedState;
    }, {});
    const store = createStore<S, A, any, any>(
      reducers,
      preloadedState as PreloadedState<S>,
      applyMiddleware(...middlewares));
    modules.forEach(module => {
      if (module.postConfigure) {
        module.postConfigure(store);
      }
    });
    return store;
  }

}

const setTopLevelKeys = (object, dest, subKey?) => {
  if (object !== null && typeof object === 'object' && !Array.isArray(object)) {
    dest = dest || {};
    const origDest = dest;
    if (subKey) {
      dest = initSubKeys(dest, subKey);
    }
    Object.keys(object)
      .forEach(key => dest[key] = setTopLevelKeys(object[key], dest[key]));
    return origDest;
  } else {
    if (subKey) {
      initSubKeys(dest, subKey, object);
      return dest;
    }
    return object;
  }
};

const isModuleType = (object : ModuleLike) : boolean => {
  return object instanceof Module || object.constructor === Module || object.___m;
};

const initSubKeys = (object, subKey, value?) => {
  const keyParts = subKey.split('/');
  while (keyParts.length > 0) {
    const part = keyParts.shift();
    object = object[part] = typeof value === 'undefined' || keyParts.length > 0 ? (object[part] || {}) : value;
  }
  return object;
};

const interceptWithHandler = (handler : ActionHolder | Action, store) => {
  if ((handler as Action).type) {
    handler = {
      action: (handler as Action)
    }
  }
  store.dispatch((handler as ActionHolder).action);
};

export const interceptor = (func : InterceptorFunction) : Middleware => {
  return (store : MiddlewareAPI) => (next : Dispatch) => (action : any) => {
    next(action);
    let handler = func(action, store.getState());
    if (handler) {
      if (Array.isArray(handler)) {
        handler.forEach(handler => interceptWithHandler(handler, store));
      } else {
        interceptWithHandler(handler, store);
      }
    }
  };
};
