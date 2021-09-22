import {
  createModule,
  ReduxModule,
  isAction,
  ReduxModuleTypeContainer,
  ReduxModuleTypeContainerAny,
} from './index';
import { expectType, TypeEqual, TypeOf } from 'ts-expect';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { ReduxModuleTypeContainerCombinedWith } from './redux-module';

/**
 * Action types which can be dispatched
 */
type ActionTypeFromDispatch<TDispatch> = TDispatch extends Dispatch<
  infer TAction
> &
  ThunkDispatch<any, any, infer TAction>
  ? TAction
  : never;

type ActionTypes = { type: 'SOME_ACTION' } | { type: 'ANOTHER_ACTION' };
type StateType = { actionTypes: string[] };

describe('redux-modules', () => {
  it('can be created', () => {
    const mod = createModule('test')
      .reduce((state: StateType, action: ActionTypes) => {
        return { ...state, actionTypes: [...state.actionTypes, action.type] };
      })
      .on((store) => (next) => (action) => {
        expectType<
          TypeEqual<
            ReturnType<typeof store.getState>,
            Readonly<{ test: StateType }>
          >
        >(true);
        expectType<TypeEqual<typeof action, ActionTypes>>(true);
        next(action);
      })
      .on('E_A', () => (next) => (action) => {
        expectType<TypeEqual<typeof action, { type: 'SOME_ACTION' }>>(true);
        next(action);
      })
      .on('ANOTHER_', () => (next) => (action) => {
        expectType<TypeEqual<typeof action, { type: 'ANOTHER_ACTION' }>>(true);
        next(action);
      });
    expectType<
      TypeOf<
        ReduxModule<ReduxModuleTypeContainer<'test', StateType, ActionTypes>>,
        typeof mod
      >
    >(true);
  });
  it('can define required initialization properties', () => {
    const notInitialized = createModule('test', {
      initializer({ someValue }: { someValue: boolean }) {
        return { someValue };
      },
    }).reduce((state: { someState: string }, action, props) => {
      expectType<TypeEqual<typeof props, Readonly<{ someValue: boolean }>>>(
        true
      );
      expect(props.someValue).toBe(true);
      expect(action).toBeDefined();
      return state;
    });
    // can't be made into a store unless the props are fullfiled (no asStore method on type)
    expectType<'asStore' extends keyof typeof notInitialized ? true : false>(
      false
    );
    const initialized = notInitialized.initialize({ someValue: true });
    expectType<'asStore' extends keyof typeof initialized ? true : false>(true);

    // props can be accessed in configure
    initialized
      .configure((store) => {
        expect(store.props.someValue).toBe(true);
        expectType<
          TypeEqual<typeof store.props, Readonly<{ someValue: boolean }>>
        >(true);
      })
      .asStore();

    // combined modules need all props fullfiled
    const anotherNotInitialized = createModule('test2', {
      initializer({ anotherValue }) {
        return { anotherValue: `processed_${anotherValue}` };
      },
    });
    expectType<
      'asStore' extends keyof typeof anotherNotInitialized ? true : false
    >(false);
    const combinedNotInitialized = notInitialized.with(anotherNotInitialized);
    expectType<
      'asStore' extends keyof typeof combinedNotInitialized ? true : false
    >(false);
    const combinedInitialized = combinedNotInitialized.initialize({
      someValue: true,
      anotherValue: 'another_value',
    });
    combinedInitialized
      .configure((store) => {
        expect(store.props.someValue).toBe(true);
        expect(store.props.anotherValue).toBe('processed_another_value');
        expectType<
          TypeEqual<
            typeof store.props,
            Readonly<{ someValue: boolean } & { anotherValue: string }>
          >
        >(true);
      })
      .asStore();

    // props can be access in middleware
    initialized
      .on((store) => (next) => (action) => {
        expectType<
          TypeEqual<typeof store.props, Readonly<{ someValue: boolean }>>
        >(true);
        expect(store.props.someValue).toBeTruthy();
        next(action);
      })
      .asStore()
      .dispatch({ type: 'SOMETHING' });

    combinedInitialized
      .on((store) => (next) => (action) => {
        expectType<
          TypeEqual<
            typeof store.props,
            Readonly<{ someValue: boolean } & { anotherValue: string }>
          >
        >(true);
        expect(store.props.someValue).toBeTruthy();
        expect(store.props.anotherValue).toBe('processed_another_value');
        next(action);
      })
      .asStore()
      .dispatch({ type: 'SOMETHING' });
  });
  it('does not require initialization if all initializaton props are optional', () => {
    const mod = createModule('test', {
      initializer(opts): { id?: string } {
        if (!opts.id) {
          opts.id = 'this-is-the-default';
        }
        return opts;
      },
    }).reduce((state, action, props) => {
      expect(action).toBeDefined();
      return { ...state, something: props.id };
    });
    type T = {} extends Required<{ foo?: string }> ? true : false;
    // it can still initialize
    expectType<'initialize' extends keyof typeof mod ? true : false>(true);
    // but also skip initialization and just create the store
    expectType<'asStore' extends keyof typeof mod ? true : false>(true);
    expect(
      mod.initialize({ id: 'override' }).asStore().getState().test.something
    ).toBe('override');
    expect(mod.asStore().getState().test.something).toBe('this-is-the-default');
  });
  it('combining an uninitialized module with an uninitialized module which has optional props results in an uninitialized module', () => {
    const mode2 = createModule('test').with(
      createModule('test2', {
        initializer(props: { test2Prop: string }) {
          return props;
        },
      })
    );
    const mod = createModule('test')
      .with(
        createModule('test2', {
          initializer(props: { test2Prop: string }) {
            return props;
          },
        })
      )
      .with(
        createModule('test3', {
          initializer(props: { test3Prop?: string }) {
            return props;
          },
        })
      );
    expectType<'initialize' extends keyof typeof mod ? true : false>(true);
    expectType<'asStore' extends keyof typeof mod ? true : false>(false);
  });
  it('allows partial initialization', () => {
    const mod = createModule('test', {
      initializer(props: { propA: string; propB: string }) {
        return props;
      },
    })
      .with(
        createModule('test2', {
          initializer(props: { propC: string; propD?: string }) {
            return props;
          },
        })
      )
      .initialize({ propA: 'a-val' });
    // should still require initialization
    expectType<'initialize' extends keyof typeof mod ? true : false>(true);
    expectType<'asStore' extends keyof typeof mod ? true : false>(false);
    const mod2 = mod.initialize({ propB: 'b-val', propC: 'c-val' });
    // only remaining prop is optional, can initialize further or create the store
    expectType<'initialize' extends keyof typeof mod2 ? true : false>(true);
    expectType<'asStore' extends keyof typeof mod2 ? true : false>(true);
    const mod3 = mod2.initialize({ propD: 'd-val' });
    expect(mod3.asStore().props).toEqual({
      propA: 'a-val',
      propB: 'b-val',
      propC: 'c-val',
      propD: 'd-val',
    });
  });
  it('can initialize props with a function', () => {
    expect(
      createModule('test', {
        initializer(props: { something: string }) {
          return props;
        },
        actionCreators: {
          doSomething(): ActionTypes {
            return { type: 'SOME_ACTION' };
          },
        },
      })
        .initialize(({ actions }) => {
          expectType<
            TypeEqual<
              typeof actions,
              { test: { doSomething: () => ActionTypes } } & {
                doSomething: () => ActionTypes;
              }
            >
          >(true);
          return {
            something: actions.test.doSomething().type,
          };
        })
        .asStore().props.something
    ).toEqual('SOME_ACTION');
  });
  it('can run a configuration function when made into a store', () => {
    const store = createModule('foo')
      .reduce((state: StateType = { actionTypes: [] }, action: ActionTypes) => {
        return { ...state, actionTypes: [...state.actionTypes, action.type] };
      })
      .configure((store) => {
        store.dispatch({ type: 'SOME_ACTION' });
      })
      .asStore();
    expect(store.getState().foo.actionTypes[1]).toBe('SOME_ACTION');
  });
  it('can have a nested store path', () => {
    createModule('foo->bar->baz')
      .reduce((state: StateType = { actionTypes: [] }, action: ActionTypes) => {
        return { ...state, actionTypes: [...state.actionTypes, action.type] };
      })
      .on((store) => (next) => (action) => {
        expectType<
          TypeEqual<
            ReturnType<typeof store.getState>,
            Readonly<{ foo: { bar: { baz: StateType } } }>
          >
        >(true);
        expectType<TypeEqual<typeof action, ActionTypes>>(true);
        next(action);
      });
  });
  it('can combine reducers with nested store paths', () => {
    const mod = createModule('foo->bar->baz')
      .reduce((state: StateType = { actionTypes: [] }, action: ActionTypes) => {
        return { ...state, actionTypes: [...state.actionTypes, action.type] };
      })
      .on((store) => (next) => (action) => {
        expectType<
          TypeEqual<
            ReturnType<typeof store.getState>,
            Readonly<{ foo: { bar: { baz: StateType } } }>
          >
        >(true);
        expectType<TypeEqual<typeof action, ActionTypes>>(true);
        next(action);
      })
      .with(
        createModule('foo->bar').reduce(
          (state: { fooBar: string } = { fooBar: '' }) => {
            return { ...state, fooBar: 'abc' };
          }
        )
      );
    const store = mod.asStore();
    expectType<
      TypeEqual<
        ReturnType<typeof store.getState>,
        Readonly<
          {
            foo: {
              bar: {
                baz: StateType;
              };
            };
          } & {
            foo: {
              bar: {
                fooBar: string;
              };
            };
          }
        >
      >
    >(true);
    store.dispatch({ type: 'SOME_ACTION' });
    expect(store.getState().foo.bar.fooBar).toBe('abc');
    expect(store.getState().foo.bar.baz.actionTypes.length).toBe(1);
    expect(store.getState().foo.bar.baz.actionTypes[0]).toBe('SOME_ACTION');
  });
  it('can be combined with other modules', () => {
    const mod1 = createModule('test').reduce(
      (state: StateType, action: ActionTypes) => {
        return { ...state, actionTypes: [...state.actionTypes, action.type] };
      }
    );
    const mod2 = createModule('mod2')
      .preloadedState({ mod2Stuff: 'blep' })
      .reduce(
        (
          state: { mod2Stuff: string },
          action: { type: 'MOD2_ACTION' }
        ): { mod2Stuff: string } => {
          return { ...state, mod2Stuff: action.type };
        }
      );
    mod1
      .with(mod2)
      .on((store) => () => (action) => {
        // Store state is combined
        expectType<
          TypeEqual<
            ReturnType<typeof store.getState>,
            Readonly<{ test: StateType } & { mod2: { mod2Stuff: string } }>
          >
        >(true);
        // Middleware can operate on union of action types
        expectType<
          TypeEqual<typeof action, ActionTypes | { type: 'MOD2_ACTION' }>
        >(true);
      })
      .on('_ACTION', () => () => (action) => {
        expectType<
          TypeEqual<typeof action, ActionTypes | { type: 'MOD2_ACTION' }>
        >(true);
      })
      .on('MOD2', () => () => (action) => {
        expectType<TypeEqual<typeof action, { type: 'MOD2_ACTION' }>>(true);
      });
  });
  it('can be made into a store', () => {
    const mod = createModule('test', {
      actionCreators: {
        doSomething(): { type: 'DO_SOMETHING' } {
          return { type: 'DO_SOMETHING' };
        },
      },
    })
      .reduce((state: StateType, action) => {
        return { ...state, actionTypes: [...state.actionTypes, action.type] };
      })
      .preloadedState({ actionTypes: [] })
      .with(
        createModule('test2', {
          actionCreators: {
            doSomeAction(): { type: 'SOME_ACTION' } {
              return { type: 'SOME_ACTION' };
            },
            doTest2Action(): { type: 'TEST2_ACTION'; something?: number } {
              return { type: 'TEST2_ACTION', something: 12 };
            },
          },
        }).reduce((state: { actionTypeLength: number }, action) => {
          return { ...state, actionTypeLength: action.type.length };
        })
      )
      .on('SOME_*ION', () => (next) => (action) => {
        expectType<TypeEqual<typeof action, { type: 'SOME_ACTION' }>>(true);
        next({ ...action, type: action.type + '_from_middleware' });
      });
    const store = mod.asStore();
    const storeState = store.getState();
    expectType<
      TypeEqual<
        typeof storeState,
        Readonly<{ test: StateType } & { test2: { actionTypeLength: number } }>
      >
    >(true);
    expectType<
      TypeEqual<
        ActionTypeFromDispatch<typeof store.dispatch>,
        | {
            type: 'DO_SOMETHING';
          }
        | {
            type: 'SOME_ACTION';
          }
        | {
            type: 'TEST2_ACTION';
            something?: number;
          }
      >
    >(true);
    store.dispatch(store.actions.test2.doSomeAction());
    expect(store.getState().test.actionTypes).toEqual(
      expect.arrayContaining(['SOME_ACTION_from_middleware'])
    );
    expect(store.getState().test2.actionTypeLength).toBe(27);
  });
  it('can be made into an immutable store', () => {
    expect.assertions(1);
    const store = createModule('test')
      .reduce((state: StateType, action: ActionTypes) => {
        state.actionTypes = [action.type];
        return state;
      })
      .preloadedState({ actionTypes: [] })
      .asStore({ enforceImmutableState: true });
    try {
      store.dispatch({ type: 'SOME_ACTION' });
    } catch (err) {
      expect(err.message).toContain('A state mutation was detected');
    }
  });
  it('can be made into a recorded store', async () => {
    const store = createModule('test')
      .reduce((state: StateType, action: ActionTypes) => {
        return { ...state, actionTypes: [...state.actionTypes, action.type] };
      })
      .preloadedState({ actionTypes: [] })
      .asStore({ record: true, enforceImmutableState: true });
    setTimeout(() => {
      store.dispatch({ type: 'SOME_ACTION' });
    }, 500);
    const found = await store.getState().recording.waitFor('SOME_ACTION');
    expect(found).toBeDefined();
    // the result of find(type: string) should be constrained to matching type
    expect(store.getState().recording.find('SOME_ACTION')).toHaveLength(1);
    const oneFound = store.getState().recording.find('SOME_ACTION')[0];
    expectType<TypeEqual<typeof oneFound, { type: 'SOME_ACTION' }>>(true);
    let handlerCaptured: string = '';
    expect(
      store.getState().recording.find(
        (action) => action.type === 'SOME_ACTION',
        (actions) => (handlerCaptured = `handler_${actions.length}`)
      )
    ).toHaveLength(1);
    expect(handlerCaptured).toBe('handler_1');
    expect(store.getState().recording.contains('SOME_ACTION')).toBe(true);
  });
  it('can infer state type from preloadedState', () => {
    const store = createModule('test')
      .preloadedState({ actionTypes: [] } as { actionTypes: ActionTypes[] })
      .reduce((state, action: ActionTypes) => {
        expectType<TypeEqual<typeof state, { actionTypes: ActionTypes[] }>>(
          true
        );
        expectType<TypeEqual<typeof action, ActionTypes>>(true);
        return state;
      })
      .asStore();
    expectType<
      TypeEqual<
        ReturnType<typeof store['getState']>,
        Readonly<{ test: { actionTypes: ActionTypes[] } }>
      >
    >(true);
    expectType<
      TypeEqual<ActionTypeFromDispatch<typeof store['dispatch']>, ActionTypes>
    >(true);
  });
  it('can infer state type from reducer when an indexable type', () => {
    type StateType = {
      [k: string]: {
        something: number;
      };
    };
    const store = createModule('test')
      .reduce((state: StateType) => {
        return state;
      })
      .preloadedState({ sd: { something: 12 } })
      .asStore();
    expectType<
      TypeEqual<
        ReturnType<typeof store.getState>,
        Readonly<{ test: StateType }>
      >
    >(true);
  });
  it('can infer action type from middleware', () => {
    const store = createModule()
      .on(() => (next) => (action: ActionTypes) => {
        next(action);
      })
      .on('SOME_', () => () => (action) => {
        expectType<TypeEqual<typeof action, { type: 'SOME_ACTION' }>>(true);
      })
      .asStore();
    expectType<
      TypeEqual<ReturnType<typeof store['getState']>, Readonly<unknown>>
    >(true);
    expectType<
      TypeEqual<ActionTypeFromDispatch<typeof store['dispatch']>, ActionTypes>
    >(true);
  });
  it('can infer action types used by middleware from action creators', () => {
    const mod = createModule({
      actionCreators: {
        someAction(someValue: string): { type: 'SOME_ACTION'; value: string } {
          return {
            type: 'SOME_ACTION',
            value: someValue,
          };
        },
        anotherAction(): { type: 'ANOTHER_ACTION' } {
          return {
            type: 'ANOTHER_ACTION',
          };
        },
      },
    });
    expect(mod.actions.someAction('abc')).toEqual({
      type: 'SOME_ACTION',
      value: 'abc',
    });
    expectType<
      TypeEqual<
        ReturnType<typeof mod.actions.someAction>,
        { type: 'SOME_ACTION'; value: string }
      >
    >(true);
    expect(mod.actions.anotherAction()).toEqual({
      type: 'ANOTHER_ACTION',
    });
    expectType<
      TypeEqual<
        ReturnType<typeof mod.actions.anotherAction>,
        { type: 'ANOTHER_ACTION' }
      >
    >(true);
    const store = mod.asStore();
    expectType<
      TypeEqual<
        ActionTypeFromDispatch<typeof store.dispatch>,
        { type: 'SOME_ACTION'; value: string } | { type: 'ANOTHER_ACTION' }
      >
    >(true);
  });
  it('action creators can reference `this`', () => {
    const mod = createModule('test', {
      actionCreators: {
        someAction(someValue: string): { type: 'SOME_ACTION'; value: string } {
          return {
            type: 'SOME_ACTION',
            value: someValue,
          };
        },
        anotherAction() {
          return this.someAction('from-another-action');
        },
      },
    });
    const store = mod.asStore();
    type ActionTypes = ActionTypeFromDispatch<typeof store.dispatch>;
    expectType<TypeEqual<ActionTypes, { type: 'SOME_ACTION'; value: string }>>(
      true
    );
    expect(mod.actions.anotherAction().value).toBe('from-another-action');
    expect(store.actions.test.anotherAction().value).toBe(
      'from-another-action'
    );
    {
      // it can call this when destructured from module actions
      const { anotherAction } = mod.actions;
      expect(anotherAction().value).toBe('from-another-action');
    }
    {
      // it can call this when destructured from store actions
      const { anotherAction } = store.actions.test;
      expect(anotherAction().value).toBe('from-another-action');
    }
  });
  it('works with thunks', async () => {
    const store = createModule('test')
      .reduce((state: { hi: string }, action: { type: 'SOME_ACTION' }) => {
        return { ...state, hi: `${action.type}` };
      })
      .asStore({ record: true });
    store.dispatch((dispatch, getState) => {
      expectType<
        TypeEqual<ReturnType<typeof getState>['test'], { hi: string }>
      >(true);
      setTimeout(() => {
        dispatch({ type: 'SOME_ACTION' });
      }, 100);
    });
    const found = await store.getState().recording.waitFor('SOME_ACTION');
    expect(found[0].type).toBe('SOME_ACTION');
  });
  it('can be made into a reloadable store', async () => {
    const store = createModule('test')
      .reduce((state: { hi: string }, action: { type: 'SOME_ACTION' }) => {
        return { ...state, hi: `${action.type}` };
      })
      .asStore({ deferred: true, record: true });
    store.dispatch({ type: 'SOME_ACTION' });
    expect(store.getState().recording.find('SOME_ACTION').length).toBe(1);
    store.reload();
    expect(store.getState().recording.find('SOME_ACTION').length).toBe(0);
  });
  describe('isAction', () => {
    type ActionTypes =
      | { type: 'SOME_ACTION'; a: boolean }
      | { type: 'ANOTHER_ACTION'; b: number };
    const action: ActionTypes = { type: 'SOME_ACTION', a: true } as any;
    expect(isAction(action, 'ASDASD')).toBe(false);
    expect(isAction(action, 'SOME')).toBe(true);
    expect(isAction(action, 'SO*ACTION')).toBe(true);
    expect(isAction(action, 'SO*ACTIO*asdas')).toBe(false);
    if (isAction(action, 'SO*AC*TIO')) {
      expectType<TypeEqual<typeof action, { type: 'SOME_ACTION'; a: boolean }>>(
        true
      );
    }
    if (isAction(action, 'AN')) {
      expectType<
        TypeEqual<typeof action, { type: 'ANOTHER_ACTION'; b: number }>
      >(true);
    }
    if (isAction(action, 'ACTION')) {
      expectType<TypeEqual<typeof action, ActionTypes>>(true);
    }
  });
  it('makes state, actionCreators and props readonly at runtime', () => {
    const messages: Set<string> = new Set();
    createModule('test', {
      initializer(props: { something: string }) {
        return props;
      },
      actionCreators: {
        doSomething(): ActionTypes {
          return { type: 'SOME_ACTION' };
        },
      },
    })
      .reduce((state: StateType, action: ActionTypes, props) => {
        expect(action).toBeDefined();
        try {
          (props as any).something = 'b';
        } catch (err) {
          messages.add(err.message);
        }
        return state;
      })
      .on((store) => (next) => (action) => {
        try {
          (store.actions as any).doSomething = 'something';
        } catch (err) {
          messages.add(err.message);
        }
        next(action);
      })
      .initialize({ something: 'abc' })
      .asStore()
      .dispatch({ type: 'SOME_ACTION' });
    expect(Array.from(messages)).toHaveLength(2);
    expect(Array.from(messages)[0]).toContain(
      "Cannot assign to read only property 'something' of object"
    );
    expect(Array.from(messages)[1]).toContain(
      "Cannot assign to read only property 'doSomething' of object"
    );
  });
  it('a module is assignable to ReduxModule<ReduxModuleTypeContainerAny>', () => {
    expectType<ReduxModule<ReduxModuleTypeContainerAny>>(createModule());
    expectType<ReduxModule<ReduxModuleTypeContainerAny>>(
      createModule('foo->bar')
    );
    expectType<ReduxModule<ReduxModuleTypeContainerAny>>(
      createModule('foo->bar').reduce(
        (state: StateType, action: ActionTypes) => {
          return { ...state, actionTypes: [action.type] };
        }
      )
    );
    expectType<ReduxModule<ReduxModuleTypeContainerAny>>(
      createModule('foo->bar', {
        initializer(props: { something: string }) {
          return props;
        },
      })
    );
    function testFunc<T extends ReduxModule<ReduxModuleTypeContainerAny>>(
      mod: T
    ) {
      expectType<TypeOf<T, typeof mod>>(true);
    }
    const mod = createModule('foo').reduce(
      (state: StateType, action: ActionTypes) => {
        return { ...state, actionTypes: [action.type] };
      }
    );
    type TestFunArg0 = Parameters<typeof testFunc>[0];
    expectType<TypeOf<TestFunArg0, typeof mod>>(true);
    const funArg0: TestFunArg0 = mod;
    expect(funArg0).toBeDefined();
  });
  it('can define interceptor middlewares', async () => {
    const store = createModule('test', {
      initializer(props: { something?: string }) {
        return props;
      },
      actionCreators: {
        doSomething(): ActionTypes {
          return { type: 'SOME_ACTION' };
        },
        doSomethingElse(): ActionTypes {
          return { type: 'ANOTHER_ACTION' };
        },
      },
    })
      .preloadedState({
        actionTypes: [],
      } as StateType)
      .intercept((action, { actions, state, props }) => {
        expectType<ActionTypes>(action);
        expectType<{ test: StateType }>(state);
        expectType<{ something?: string }>(props);
        if (action.type === 'SOME_ACTION') {
          return (dispatch) => {
            dispatch({
              ...actions.test.doSomethingElse(),
              source: 'from-thunk',
            });
          };
        }
      })
      .intercept((action, { actions }) => {
        if (action.type === 'SOME_ACTION') {
          return [{ ...actions.test.doSomethingElse(), source: 'from-array' }];
        }
      })
      .intercept((action, { actions }) => {
        if (action.type === 'SOME_ACTION') {
          return { ...actions.test.doSomethingElse(), source: 'from-single' };
        }
      })
      .asStore({ record: true });
    store.dispatch(store.actions.test.doSomething());
    expect(
      store
        .getState()
        .recording.contains((action) => (action as any).source === 'from-thunk')
    ).toBeTruthy();
    expect(
      store
        .getState()
        .recording.contains((action) => (action as any).source === 'from-array')
    ).toBeTruthy();
    expect(
      store
        .getState()
        .recording.contains(
          (action) => (action as any).source === 'from-single'
        )
    ).toBeTruthy();
  });
  describe('ReduxModuleCompositeWith', () => {
    it('adds modules with different paths', () => {
      // combining two ReduxModuleTypeContainer with different names
      // should union them in a ReduxModuleTypeContainerComposite
      const mod1 = createModule('test');
      const mod2 = createModule('test2');
      type Mod1WithMod2 = ReduxModuleTypeContainerCombinedWith<
        typeof mod1['_types'],
        typeof mod2['_types']
      >;
      expectType<
        TypeEqual<Mod1WithMod2['_modules']['_nameType'], 'test' | 'test2'>
      >(true);
      // adding another ReduxModuleTypeContainer to the ReduxModuleTypeContainerComposite
      // from above should union the new into the modules
      const mod3 = createModule('test3');
      type Mod1WithMod2WithMod3 = ReduxModuleTypeContainerCombinedWith<
        Mod1WithMod2,
        typeof mod3['_types']
      >;
      expectType<
        TypeEqual<
          Mod1WithMod2WithMod3['_modules']['_nameType'],
          'test' | 'test2' | 'test3'
        >
      >(true);
      // adding two redux ReduxModuleTypeContainerComposite
      const mod4 = createModule('test4');
      const mod5 = createModule('test5');
      type Mod4WithMod5 = ReduxModuleTypeContainerCombinedWith<
        typeof mod4['_types'],
        typeof mod5['_types']
      >;
      type Mod1WithMod2_with_Mod4WithMod5 =
        ReduxModuleTypeContainerCombinedWith<Mod1WithMod2, Mod4WithMod5>;
      expectType<
        TypeEqual<
          Mod1WithMod2_with_Mod4WithMod5['_modules']['_nameType'],
          'test' | 'test2' | 'test4' | 'test5'
        >
      >(true);
    });
    it('combined action types into a union type', () => {
      const mod1 = createModule('test', {
        actionCreators: {
          a1(): { type: 'A1' } {
            return null;
          },
        },
      });
      const mod2 = createModule('test2', {
        actionCreators: {
          a2(): { type: 'A2' } {
            return null;
          },
        },
      });
      type Mod1WithMod2 = ReduxModuleTypeContainerCombinedWith<
        typeof mod1['_types'],
        typeof mod2['_types']
      >;
      type T = Mod1WithMod2['_actionType']['type'];
      expectType<TypeEqual<Mod1WithMod2['_actionType']['type'], 'A1' | 'A2'>>(
        true
      );
    });
    it('replaces modules with the same path', () => {
      const mod1 = createModule('test', {
        actionCreators: {
          a1(): { type: 'A1' } {
            return null;
          },
        },
      });
      const mod2 = createModule('test', {
        actionCreators: {
          a2(): { type: 'A2' } {
            return null;
          },
        },
      });
      type Mod1WithMod2 = ReduxModuleTypeContainerCombinedWith<
        typeof mod1['_types'],
        typeof mod2['_types']
      >;
      expectType<TypeEqual<Mod1WithMod2['_nameType'], 'test'>>(true);
      expectType<TypeEqual<Mod1WithMod2['_actionType']['type'], 'A2'>>(true);
    });
  });
});
