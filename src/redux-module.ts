import { Action } from 'redux';
import { TypeEqual } from 'ts-expect';
import {
  ActionFromReducer,
  ActionTypeContainsSubstring,
  RestrictToAction,
  StateFromReducer,
  StoreStateAtPath,
} from './type-helpers';
import {
  ModuleInitializer,
  ModuleInitializerCombined,
  ModuleInitializerPropsType,
  ModuleInitializerRequiresProps,
} from './module-initializer';
import { PostConfigure } from './post-configure';
import { ReduxModuleStoreOptions } from './redux-module-store-options';
import { ReduxModuleMiddleware } from './redux-module-middleware';
import { StoreFromOptions } from './store-from-options';
import { ReduxModuleReducer } from './redux-module-reducer';
import { $AND, IsAny, LastInTuple, Optional, ToTuple } from './utils';
import { ThunkAction } from 'redux-thunk';

/**
 * Provided module props.
 */
export type ProvidedModuleProps<TProps> =
  | (() => Partial<TProps>)
  | Partial<TProps>;

/**
 * Redux module type container.
 */
export type ReduxModuleTypeContainer<
  TPath extends string,
  TState,
  TAction extends Action | unknown,
  TActionCreators,
  TInitializer extends ModuleInitializer<any, any>,
  TStoreState = StoreStateAtPath<TState, TPath>,
  TPathParts extends string[] = ToTuple<TPath, '.' | '/' | '->'>
> = {
  _pathType: TPath;
  _pathTupleType: IsAny<TPath, any, TPathParts>;
  _nameType: LastInTuple<TPathParts>;
  _stateType: TState;
  _actionType: TAction;
  _actionCreatorType: TActionCreators;
  _actionCreatorsInStoreType: StoreStateAtPath<TActionCreators, TPath>;
  _initializerType: TInitializer;
  _initializerPropsType: ModuleInitializerPropsType<TInitializer>;
  _initializerRequiredPropsType: Required<
    ModuleInitializerPropsType<TInitializer>
  >;
  _storeStateType: TStoreState;
};

/**
 * Type of any redux module type container.
 */
export type ReduxModuleAny = ReduxModuleTypeContainer<
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

export type ReduxModuleUnamed = ReduxModuleTypeContainer<
  '_',
  unknown,
  unknown,
  unknown,
  undefined,
  unknown
>;

export type ReduxModuleNameOnly<TPath extends string> =
  ReduxModuleTypeContainer<
    TPath,
    unknown,
    unknown,
    unknown,
    undefined,
    unknown
  >;

export type ReduxModuleNameAndInitializerOnly<
  TPath extends string,
  TInitializer extends (prop: any) => any
> = ReduxModuleTypeContainer<
  TPath,
  unknown,
  unknown,
  unknown,
  TInitializer,
  unknown
>;

/**
 * Type of a redux module with the specified state type.
 */
type ReduxModuleTypeContainerWithStateType<
  TReduxModule extends ReduxModuleAny,
  TState,
  // TNewStoreState is intended to remove the old state from the existing store store
  TNewStoreState = (TReduxModule['_storeStateType'] extends StoreStateAtPath<
    TReduxModule['_stateType'],
    TReduxModule['_pathType']
  >
    ? never
    : TReduxModule['_storeStateType']) &
    StoreStateAtPath<TState, TReduxModule['_pathType']>
> = ReduxModuleTypeContainer<
  TReduxModule['_pathType'],
  TState,
  TReduxModule['_actionType'],
  TReduxModule['_actionCreatorType'],
  TReduxModule['_initializerType'],
  TNewStoreState
>;

/**
 * Type of a redux module with the specified action type.
 */
type ReduxModuleTypeContainerWithActionType<
  TReduxModule extends ReduxModuleAny,
  TAction
> = ReduxModuleTypeContainer<
  TReduxModule['_pathType'],
  TReduxModule['_stateType'],
  TAction,
  TReduxModule['_actionCreatorType'],
  TReduxModule['_initializerType'],
  TReduxModule['_storeStateType']
>;

/**
 * Type of a redux module with the initializer props provided.
 */
export type ReduxModuleTypeContainerWithInitializationPropsProvided<
  TReduxModule extends ReduxModuleAny,
  TPropsWhichWereProvided = TReduxModule['_initializerPropsType'],
  TRemainingProps = Optional<
    TReduxModule['_initializerPropsType'],
    keyof TPropsWhichWereProvided
  >
> = ReduxModuleTypeContainer<
  TReduxModule['_pathType'],
  TReduxModule['_stateType'],
  TReduxModule['_actionType'],
  TReduxModule['_actionCreatorType'],
  (props: TRemainingProps) => TRemainingProps,
  TReduxModule['_storeStateType']
>;

/**
 * Complex function types
 */
type PreloadedStateFunctionType<
  TReduxModuleTypeContainer extends ReduxModuleAny
> = IsAny<
  TReduxModuleTypeContainer['_pathType'],
  (
    preloadedState: any
  ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>,
  unknown extends TReduxModuleTypeContainer['_stateType']
    ? <TPreloadedState>(
        preloadedState: TPreloadedState
      ) => ReduxModuleMayRequireInitialization<
        ReduxModuleTypeContainerWithStateType<
          TReduxModuleTypeContainer,
          TPreloadedState
        >
      >
    : (
        preloadedState: Partial<TReduxModuleTypeContainer['_stateType']>
      ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>
>;

type ReduceFunctionType<TReduxModuleTypeContainer extends ReduxModuleAny> =
  IsAny<
    TReduxModuleTypeContainer['_pathType'],
    (
      reducer: ReduxModuleReducer<ReduxModuleAny>
    ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>,
    true extends $AND<
      TypeEqual<unknown, TReduxModuleTypeContainer['_stateType']>,
      TypeEqual<unknown, TReduxModuleTypeContainer['_actionType']>
    >
      ? // TState and TAction are unknown
        <
          TReducer extends ReduxModuleReducer<
            ReduxModuleTypeContainerWithActionType<
              ReduxModuleTypeContainerWithStateType<
                TReduxModuleTypeContainer,
                any
              >,
              any
            >
          >,
          TReducerState = StateFromReducer<TReducer>,
          TReducerAction = ActionFromReducer<TReducer>
        >(
          reducer: TReducer
        ) => ReduxModuleMayRequireInitialization<
          ReduxModuleTypeContainerWithActionType<
            ReduxModuleTypeContainerWithStateType<
              TReduxModuleTypeContainer,
              TReducerState
            >,
            TReducerAction
          >
        >
      : true extends TypeEqual<unknown, TReduxModuleTypeContainer['_stateType']>
      ? // TState is unknown, infer it from TReducer
        <
          TReducer extends ReduxModuleReducer<
            ReduxModuleTypeContainerWithStateType<
              TReduxModuleTypeContainer,
              any
            >
          >,
          TReducerState = StateFromReducer<TReducer>
        >(
          reducer: TReducer
        ) => ReduxModuleMayRequireInitialization<
          ReduxModuleTypeContainerWithStateType<
            TReduxModuleTypeContainer,
            TReducerState
          >
        >
      : true extends TypeEqual<
          unknown,
          TReduxModuleTypeContainer['_actionType']
        >
      ? // TAction is unkown, infer TAction from TReducer
        <
          TReducer extends ReduxModuleReducer<
            ReduxModuleTypeContainerWithActionType<
              TReduxModuleTypeContainer,
              any
            >
          >,
          TReducerAction = ActionFromReducer<TReducer>
        >(
          reducer: TReducer
        ) => ReduxModuleMayRequireInitialization<
          ReduxModuleTypeContainerWithActionType<
            TReduxModuleTypeContainer,
            TReducerAction
          >
        >
      : // TReducer should conform to existing types
        (
          reducer: ReduxModuleReducer<TReduxModuleTypeContainer>
        ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>
  >;

type OnFunctionType<TReduxModuleTypeContainer extends ReduxModuleAny> = IsAny<
  TReduxModuleTypeContainer['_pathType'],
  (
    typeOrHandler: ReduxModuleMiddleware<TReduxModuleTypeContainer> | string,
    handler?: ReduxModuleMiddleware<TReduxModuleTypeContainer>
  ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>,
  unknown extends TReduxModuleTypeContainer['_actionType']
    ? // infer TAction from TMiddleware
      <
        TMiddleware extends ReduxModuleMiddleware<
          ReduxModuleTypeContainerWithActionType<TReduxModuleTypeContainer, any>
        >,
        TActionTypeOrMiddleware extends TMiddleware | string,
        TActionFromMiddleware extends Action = RestrictToAction<
          TActionTypeOrMiddleware extends (
            ...store: any
          ) => (...next: any) => (action: infer TMiddlewareActionType) => void
            ? TMiddlewareActionType
            : TReduxModuleTypeContainer['_actionType']
        >
      >(
        typeOrHandler: TActionTypeOrMiddleware,
        handler?: TMiddleware
      ) => ReduxModuleMayRequireInitialization<
        ReduxModuleTypeContainerWithActionType<
          TReduxModuleTypeContainer,
          TActionFromMiddleware
        >
      >
    : // TMiddleware should conform to TAction
      <
        TActionTypeOrMiddleware extends
          | ReduxModuleMiddleware<TReduxModuleTypeContainer>
          | string,
        TExpectedAction extends ActionTypeContainsSubstring<
          RestrictToAction<TReduxModuleTypeContainer['_actionType']>,
          TActionTypeOrMiddleware extends string
            ? TActionTypeOrMiddleware
            : never
        >
      >(
        type: TActionTypeOrMiddleware,
        handler?: ReduxModuleMiddleware<
          ReduxModuleTypeContainerWithActionType<
            TReduxModuleTypeContainer,
            TExpectedAction
          >
        >
      ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>
>;

export type Interceptor<
  TAction extends Action,
  TStoreState,
  TActionCreators,
  TProps
> = (
  action: TAction,
  context: { state: TStoreState; actions: TActionCreators; props: TProps }
) => void | TAction | TAction[] | ThunkAction<any, TStoreState, any, TAction>;

type InterceptFunctionType<
  TReduxModuleTypeContainer extends ReduxModuleAny,
  TInterceptor extends Interceptor<Action, any, any, any> = Interceptor<
    Action,
    TReduxModuleTypeContainer['_storeStateType'],
    TReduxModuleTypeContainer['_actionCreatorType'],
    TReduxModuleTypeContainer['_initializerRequiredPropsType']
  >
> = IsAny<
  TReduxModuleTypeContainer['_pathType'],
  (
    interceptor: Interceptor<
      TReduxModuleTypeContainer['_actionType'],
      TReduxModuleTypeContainer['_storeStateType'],
      TReduxModuleTypeContainer['_actionCreatorType'],
      TReduxModuleTypeContainer['_initializerRequiredPropsType']
    >
  ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>,
  unknown extends TReduxModuleTypeContainer['_actionType']
    ? (interceptor: TInterceptor) => TInterceptor extends Interceptor<
        infer TInterceptorAction,
        any,
        any,
        any
      >
        ? // infer TAction from TInterceptor
          ReduxModuleMayRequireInitialization<
            ReduxModuleTypeContainerWithActionType<
              TReduxModuleTypeContainer,
              TInterceptorAction
            >
          >
        : // not a Interceptor
          never
    : // confirm TInterceptor to
      (
        interceptor: Interceptor<
          TReduxModuleTypeContainer['_actionType'],
          TReduxModuleTypeContainer['_storeStateType'],
          TReduxModuleTypeContainer['_actionCreatorType'],
          TReduxModuleTypeContainer['_initializerRequiredPropsType']
        >
      ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>
>;

export interface ReduxModule<TReduxModuleTypeContainer extends ReduxModuleAny> {
  readonly _types: TReduxModuleTypeContainer;
  readonly path: TReduxModuleTypeContainer['_pathType'];
  readonly name: TReduxModuleTypeContainer['_nameType'];
  readonly actions: TReduxModuleTypeContainer['_actionCreatorType'];
  configure(
    configure: PostConfigure<TReduxModuleTypeContainer>
  ): ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>;
  preloadedState: PreloadedStateFunctionType<TReduxModuleTypeContainer>;
  reduce: ReduceFunctionType<TReduxModuleTypeContainer>;
  on: OnFunctionType<TReduxModuleTypeContainer>;
  intercept: InterceptFunctionType<TReduxModuleTypeContainer>;
  with<
    OtherModule extends ReduxModuleRequiresInitializationOrFullyInitialized<any>
  >(
    module: OtherModule
  ): OtherModule extends ReduxModuleRequiresInitializationOrFullyInitialized<
    infer TWReduxModule
  >
    ? TWReduxModule extends ReduxModuleAny
      ? ReduxModuleMayRequireInitialization<
          ReduxModuleTypeContainer<
            TReduxModuleTypeContainer['_pathType'],
            TReduxModuleTypeContainer['_stateType'],
            RestrictToAction<
              | TReduxModuleTypeContainer['_actionType']
              | TWReduxModule['_actionType']
            >,
            TReduxModuleTypeContainer['_actionCreatorType'],
            ModuleInitializerCombined<
              TReduxModuleTypeContainer['_initializerType'],
              TWReduxModule['_initializerType']
            >,
            TReduxModuleTypeContainer['_storeStateType'] &
              TWReduxModule['_storeStateType']
          >
        >
      : never
    : never;
}

/**
 * Interface for a redux module which requires initialization before it can be made into a store.
 */
export interface ReduxModuleRequiresInitialization<
  TReduxModule extends ReduxModuleAny
> extends ReduxModule<TReduxModule> {
  initialize<
    TInitializerPropsProvided extends ProvidedModuleProps<
      TReduxModule['_initializerPropsType']
    >
  >(
    props: TInitializerPropsProvided
  ): TInitializerPropsProvided extends ProvidedModuleProps<infer TProps>
    ? ReduxModuleMayRequireInitialization<
        ReduxModuleTypeContainerWithInitializationPropsProvided<
          TReduxModule,
          TProps
        >
      >
    : ReduxModuleMayRequireInitialization<TReduxModule>;
}

/**
 * Interface for a redux module which is fully initialized.
 */
export interface ReduxModuleFullyInitialized<
  TReduxModule extends ReduxModuleAny
> extends ReduxModule<TReduxModule> {
  asStore<
    TReduxModuleStoreOptions extends ReduxModuleStoreOptions<
      TReduxModule['_storeStateType']
    >
  >(
    options?: TReduxModuleStoreOptions
  ): StoreFromOptions<TReduxModule, TReduxModuleStoreOptions>;
}

/**
 * Type of a redux module which yields either a ReduxModuleRequiresInitialization
 * or ReduxModuleFullyInitialized whether initialization props have been supplied.
 */
export type ReduxModuleMayRequireInitialization<
  TReduxModule extends ReduxModuleAny,
  TReduxModuleFullyInitialized = ReduxModuleFullyInitialized<TReduxModule>,
  TReduxModuleRequiresInitialization = ReduxModuleRequiresInitialization<TReduxModule>
> = IsAny<
  TReduxModule['_pathType'],
  ReduxModule<TReduxModule>,
  ModuleInitializerRequiresProps<
    TReduxModule['_initializerType'],
    TReduxModuleRequiresInitialization,
    TReduxModuleFullyInitialized
  >
>;

/**
 * Type of either an initialized or uninitialized redux module.
 */
export type ReduxModuleRequiresInitializationOrFullyInitialized<
  TReduxModule extends ReduxModuleAny
> =
  | ReduxModuleFullyInitialized<TReduxModule>
  | ReduxModuleRequiresInitialization<TReduxModule>;
