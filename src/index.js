import {
    applyMiddleware,
    combineReducers,
    createStore,
    bindActionCreators
} from 'redux';
import { connect } from 'react-redux'

const ROOT_MODULE = 'root';

export const connectModule = (connect, module, mapStateToProps) => {
    return connect(
        mapStateToProps || ((state) => state),
        dispatch => bindActionCreators(module.actions, dispatch)
    );
};

const handleUndefinedState = state => state === undefined ? {} : state;

export class Module {

    static RecordingModule() {
        return Module.fromReducer({ recording: '@name' }, (state = {actions: []}, action) => {
            const newState = JSON.parse(JSON.stringify(state));
            newState.actions.push(action);
            newState.containsType = (type) => newState.actions.filter(action => action.type === type).length > 0;
            newState.findType = (type) => newState.actions.filter(action => action.type === type);
            newState.types = newState.actions.map((action, index) => `[${index}] ${action.type}`).join('\n');
            return newState;
        });
    }

    constructor(name, reducer, middleware, actions) {
        this.name = name || ROOT_MODULE;
        this.reducer = reducer;
        this.middleware = middleware;
        this.actions = actions || {};
        this._ = connectModule(connect, this);
    }

    connect(mapStateToProps) {
        return connectModule(connect, this, mapStateToProps);
    }

    enforceImmutableState() {
        this.middleware = this.middleware || [];
        if (!Array.isArray(this.middleware)) {
            this.middleware = [this.middleware];
        }
        this.middleware.unshift(require('redux-immutable-state-invariant').default());
        return this;
    }

    inStore(...modules) {
        modules = modules.map(module => module instanceof Module ? module : Module.create(module));
        modules.unshift(this);
        return Module.createStore(...modules);
    }

    inRecordedStore(...modules) {
        modules.push(Module.RecordingModule());
        return this.inStore(...modules);
    }

    static create({ name, reducer, middleware, actions }) {
        if (typeof name === 'object') {
            name = Object.keys(name)[0];
        }
        return new Module(name, reducer, middleware, actions)
    }

    static fromMiddleware(middleware) {
        return Module.create({middleware});
    }

    static fromInterceptor(handler) {
        return Module.fromMiddleware(interceptor(handler));
    }

    static fromReducer(name, reducer) {
        if (typeof name === 'function' && typeof reducer === 'undefined') {
            return Module.create({reducer: name})
        }
        return Module.create({name, reducer})
    }

    static createStore(...modules) {
        modules = modules.filter(module => module && module !== null);
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
                                [reducerSubField]: {
                                    ...result
                                }
                            };
                        }
                    };
                }
                if (!reducers[reducerName]) {
                    reducers[reducerName] = [];
                }
                reducers[reducerName].push(reducerFunction);
            }
            return reducers;
        }, {});
        const reducers = combineReducers(Object.keys(reducerGroups).reduce((reducers, key) => {
            reducers[key] = reducerGroups[key].length === 1 ?
                ((state, action) => handleUndefinedState(reducerGroups[key][0](state, action))) :
                ((state, action) => handleUndefinedState(reducerGroups[key]
                    .reduce((reducedState, reducer) => reducer(reducedState, action), state)));
            return reducers;
        }, {}));
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
        return createStore(reducers, applyMiddleware(...middlewares));
    }

}

const interceptWithHandler = (handler, store) => {
    if (handler.type) {
        handler = {
            action: handler
        }
    }
    store.dispatch(handler.action);
};

export const interceptor = func => store => next => action => {
    next(action);
    let handler = func(action, store.getState());
    if (handler) {
        if (Array.isArray(handler)) {
            handler.forEach(handler => interceptWithHandler(handler, store));
        } else {
            interceptWithHandler(handler, store)
        }
    }
};
