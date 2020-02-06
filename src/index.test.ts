import {
  connectModule,
  interceptor,
  Module
} from './index';

const recordingReducer = (state = {actions: []}, action) => {
    state.actions.push(action);
    return state;
};

describe('when a store is created', () => {

    it('is configured by modules', () => {
        const store = Module.createStore(Module.create({
            name: 'test',
            reducer: (state = {actions: []}, action) => {
                state.actions.push(action);
                return state;
            },
            middleware: () => next => action => {
                action.modifications = action.type + '1';
                next(action);
            }
        }));
        store.dispatch({type: 'hi'});
        expect(store.getState().test.actions[1].type).toBe('hi');
        expect(store.getState().test.actions[1].modifications).toBe('hi1');
    });

    describe('preloadedState', () => {
        it('loads preloadedState from an object', () => {
            const store = Module.createStore(Module
                .fromReducer('something', state => state), {something: 'hi'});
            expect(store.getState().something).toBe('hi');
        });
        it('loads preloadedState from modules', () => {
            const store = Module.createStore(Module
                .fromReducer('something', state => state), Module.preloadedState({something: 'hi'}));
            expect(store.getState().something).toBe('hi');
        });
        it('loads preloadedState from modules when calling inStore', () => {
            const store = Module
                .fromReducer('something', state => state)
                .inStore(Module.preloadedState({something: 'hi'}));
            expect(store.getState().something).toBe('hi');
        });
        it('uses the name of a preloadeState module', () => {
            const store = Module
                .fromReducer('something', state => state)
                .inStore({
                    name: 'something',
                    preloadedState: 'hi'
                });
            expect(store.getState().something).toBe('hi');
        });
        it('handles names with slashes', () => {
            const store = Module
                .fromReducer('something/foo', state => state)
                .inStore({
                    name: 'something/foo',
                    preloadedState: 'hi'
                });
            expect(store.getState().something.foo).toEqual('hi');
        });
    });

    it('merges module reducers based on slash notation', () => {
        const store = Module.createStore(Module.create({
            name: 'test',
            reducer: (state = {actions: []}, action) => {
                state.actions.push(action.type + ' from first');
                return state;
            }
        }), Module.create({
            name: 'test/addl',
            reducer: (state = {actions: []}, action) => {
                state.actions.push(action.type + ' from addl');
                return state;
            }
        }));
        store.dispatch({type: 'hi'});
        expect(store.getState().test.actions[1]).toBe('hi from first');
        expect(store.getState().test.addl.actions[1]).toBe('hi from addl');
    });

    describe('when there are existing middlewares and reducers', () => {
        it('can wrap them as modules', () => {
            const middleware = () => next => action => {
                action.modifications = action.type + '2';
                next(action);
            };
            const store = Module.createStore(
                Module.fromMiddleware(middleware),
                Module.fromReducer('test', recordingReducer)
            );
            store.dispatch({type: 'hi'});
            expect(store.getState().test.actions[1].type).toBe('hi');
            expect(store.getState().test.actions[1].modifications).toBe('hi2');
        });
    });

    describe('multiple middleware', () => {
        it('accepts an array of middlewares', () => {
            const middleware1 = store => next => action => {
                if (action.type.indexOf('-1') < 0)
                    store.dispatch({type: `${action.type}-1`});
                next(action);
            };
            const middleware2 = store => next => action => {
                if (action.type.indexOf('-2') < 0)
                    store.dispatch({type: `${action.type}-2`});
                next(action);
            };
            const store = Module.fromMiddleware([middleware1, middleware2]).inRecordedStore();
            store.dispatch({type: 'TEST'});
            expect(store.getState().recording.containsType('TEST-1')).toBe(true);
            expect(store.getState().recording.containsType('TEST-2')).toBe(true);
        });
    });

    describe('interceptors', () => {
        it('accepts a function which returns actions', () => {
            const store = Module.create({
                name: 'test', middleware: interceptor((action) => {
                    if (action.type.indexOf('_FROM_INTERCEPTOR') < 0) {
                        return {type: `${action.type}_FROM_INTERCEPTOR`};
                    }
                })
            }).inRecordedStore();
            store.dispatch({type: 'TEST'});
            expect(store.getState().recording.containsType('TEST_FROM_INTERCEPTOR')).toBe(true);
            expect(store.getState().recording.containsType('TEST')).toBe(true);
        });
        describe('when an action is matched', () => {
            it('can return an action', () => {
                const store = Module.fromInterceptor((action) => {
                    if (action.type === 'TEST') {
                        return {type: 'ANOTHER_ACTION', trigger: action};
                    }
                }).inRecordedStore();
                store.dispatch({type: 'TEST'});
                expect(store.getState().recording.actions[1].type).toBe('TEST');
                expect(store.getState().recording.actions[2].type).toBe('ANOTHER_ACTION');
            });
            it('can return an action in the result', () => {
                const store = Module.fromMiddleware(interceptor((action) => {
                    if (action.type === 'TEST') {
                        return {
                            action: {
                                type: 'ANOTHER_ACTION',
                                trigger: action
                            }
                        };
                    }
                })).inRecordedStore();
                store.dispatch({type: 'TEST'});
                expect(store.getState().recording.actions[1].type).toBe('TEST');
                expect(store.getState().recording.actions[2].type).toBe('ANOTHER_ACTION');
            });
            it('can return an array of results', () => {
                const store = Module.fromMiddleware(interceptor((action) => {
                    if (action.type === 'TEST') {
                        return [{
                            action: {
                                type: 'ACTION_1',
                                trigger: action
                            }
                        }, {action: {type: 'ACTION_2', trigger: action}}];
                    }
                })).inRecordedStore();
                store.dispatch({type: 'TEST'});
                expect(store.getState().recording.actions[1].type).toBe('TEST');
                expect(store.getState().recording.actions[2].type).toBe('ACTION_1');
                expect(store.getState().recording.actions[3].type).toBe('ACTION_2');
            });
            it('passes the state to the handler', () => {
                const handler = jest.fn();
                const store = Module.fromMiddleware(interceptor(handler)).inRecordedStore();
                store.dispatch({type: 'TEST'});
                expect(handler.mock.calls[0][1]).toHaveProperty('recording');
            });
        });
    });

    describe('when there is no name associated with a reducer', () => {
        it('is applied to the root state', () => {
            const store = Module.createStore(
                Module.fromReducer(recordingReducer),
                Module.fromReducer((state : any = {actions: []}) => {
                    state.anotherReducer = state.actions.length;
                    return state;
                })
            );
            store.dispatch({type: 'hi'});
            expect(store.getState().root.actions[1].type).toBe('hi');
            expect(store.getState().root.anotherReducer).toBe(2);
        });
    });

    describe('when putting the module in a store', () => {
        it('includes itself', () => {
            const store = Module.fromReducer(recordingReducer).inStore();
            store.dispatch({type: 'hi'});
            expect(store.getState().root.actions[1].type).toBe('hi');
        });
        it('can be created to record actions', () => {
            const store = Module.fromReducer(() => {
            }).inRecordedStore();
            store.dispatch({type: 'hi'});
            expect(store.getState().recording.actions[1].type).toBe('hi');
        });
        it('can include other modules', () => {
            const store = Module.fromReducer(state => state).inStore(Module.fromReducer(recordingReducer));
            store.dispatch({type: 'hi'});
            expect(store.getState().root.actions[1].type).toBe('hi');
        });
        it('converts objects to modules', () => {
            const store = Module.fromReducer(state => state).inStore({reducer: recordingReducer});
            store.dispatch({type: 'hi'});
            expect(store.getState().root.actions[1].type).toBe('hi');
        });
    });

    describe('when connecting modules', () => {
        it('can return a react-redux connect function', () => {
            expect(typeof Module.fromReducer(recordingReducer).connect()(() => {
            })).toBe('function');
        });
        it('uses a default mapStateToProps function', () => {
            const connect = jest.fn();
            connectModule(connect, Module.fromReducer(recordingReducer));
            expect(connect.mock.calls[0][0]('a')).toBe('a');
            expect(connect.mock.calls[0][1]()).toEqual({});
        });
        it('can be provided a mapStateToProps function', () => {
            const connect = jest.fn();
            connectModule(connect, Module.fromReducer(recordingReducer), () => 'hi');
            expect(connect.mock.calls[0][0]()).toBe('hi');
            expect(connect.mock.calls[0][1]()).toEqual({});
        });
    });

    describe('when a reducer returns undefined', () => {
        it('returns an empty object', () => {
            const store = Module.fromReducer(() => undefined).inStore();
            store.dispatch({type: 'hi'});
            expect(store.getState().root).toEqual({});
        });
    });

    describe('enforceImmutableState', () => {
        it('makes the state immutable', () => {
            expect.assertions(1);
            const store = Module.createStore(Module.fromReducer((state, action) => {
                if (action.type == 'test-action') {
                    state.data = 'mutated';
                    return state;
                }
            }).enforceImmutableState(), {
                root: {
                    data: 'initial'
                }
            });
            try {
                store.dispatch({type: 'test-action'});
            } catch (err) {
                expect(err.message).toMatch('mutation was detected');
            }
        });
    });

    describe('post configure actions', () => {
        it('can dispatch actions after the store is created', () => {
            const store = Module.create({
                name: 'test',
                postConfigure: store => {
                    store.dispatch({type: 'TEST'});
                }
            }).inRecordedStore();
            expect(store.getState().recording.containsType('TEST')).toBe(true);
        });
    });

    describe('recording-module', () => {
      it('can wait for actions to dispatch', () => {
        expect.assertions(1);
        const store = Module.create({name: 'test'}).inRecordedStore();
        const promise = store
          .getState().recording.waitForType((action) => action.type === 'SOMETHING')
          .then((found) => {
            expect(found.length).toBe(2);
          });
        setTimeout(() => {
          store.dispatch({type: 'SOMETHING'});
          store.dispatch({type: 'SOMETHING'});
        }, 1);
        return promise;
      });
    });

});
