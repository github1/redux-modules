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
import {
  $AND,
  IsAny,
  LastInTuple,
  Optional,
  ToTuple,
  UnionToIntersection,
} from './utils';
import { ThunkAction } from 'redux-thunk';

export type ReduxModuleTypeContainer<
  TPath extends string,
  TState,
  TAction extends Action | unknown,
  TActionCreators extends Record<string, (...args: any) => TAction> | unknown,
  TInitializer extends ModuleInitializer<any, any>,
  TPathTuple extends string[] = ToTuple<TPath, '.' | '/' | '->'>
> = {
  _pathType: TPath;
  _nameType: LastInTuple<TPathTuple>;
  _stateType: TState;
  _actionType: TAction;
  _actionCreatorType: TActionCreators;
  _initializerType: TInitializer;
  _initializerRequiredPropsType: Required<
    ModuleInitializerPropsType<TInitializer>
  >;
  _initializerPropsType: ModuleInitializerPropsType<TInitializer>;
  _storeStateType: StoreStateAtPath<TState, TPath>;
  _storeActionCreatorsType: StoreStateAtPath<TActionCreators, TPath>;
};

export type ReduxModuleTypeContainerAny = ReduxModuleTypeContainer<
  any, // path
  any, // state
  any, // action
  any, // actionCreator
  any // initializer
>;

export type ReduxModuleTypeContainerComposite<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TReduxModuleTypeContainerMembers extends ReduxModuleTypeContainerAny = never,
  TReduxModuleTypeContainerMembersAll extends ReduxModuleTypeContainerAny =
    | TReduxModuleTypeContainer
    | TReduxModuleTypeContainerMembers
> = ReduxModuleTypeContainer<
  TReduxModuleTypeContainer['_pathType'],
  TReduxModuleTypeContainer['_stateType'],
  TReduxModuleTypeContainerMembersAll['_actionType'],
  TReduxModuleTypeContainer['_actionCreatorType'],
  ModuleInitializerCombined<
    TReduxModuleTypeContainerMembersAll['_initializerType']
  >
> & {
  _modules: TReduxModuleTypeContainerMembersAll;
  // TODO handle ReduxModuleTypeContainerComposite types in the union type
  _storeStateType: UnionToIntersection<
    TReduxModuleTypeContainerMembersAll extends ReduxModuleTypeContainer<
      infer TReduxModuleTypeContainerMembersAllPath,
      infer TReduxModuleTypeContainerMembersAllState,
      any,
      any,
      any
    >
      ? StoreStateAtPath<
          TReduxModuleTypeContainerMembersAllState,
          TReduxModuleTypeContainerMembersAllPath
        >
      : never
  >;
  _storeActionCreatorsType: UnionToIntersection<
    TReduxModuleTypeContainerMembersAll extends ReduxModuleTypeContainer<
      infer TReduxModuleTypeContainerMembersAllPath,
      any,
      any,
      infer TReduxModuleTypeContainerMembersAllActionCreator,
      any
    >
      ? StoreStateAtPath<
          TReduxModuleTypeContainerMembersAllActionCreator,
          TReduxModuleTypeContainerMembersAllPath
        >
      : never
  >;
};

export type ReduxModuleTypeContainerUnamed = ReduxModuleTypeContainer<
  '_', // path
  unknown, // state
  unknown, // action
  unknown, // actionCreators
  undefined // initializer
>;

type ReduxModuleTypeContainerWithPath<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TPath extends string
> = TReduxModuleTypeContainer extends ReduxModuleTypeContainerComposite<
  infer TReduxModuleTypeContainerCompositePrimary,
  infer TReduxModuleTypeContainerCompositeMembers
>
  ? ReduxModuleTypeContainerComposite<
      ReduxModuleTypeContainerWithPath<
        TReduxModuleTypeContainerCompositePrimary,
        TPath
      >,
      TReduxModuleTypeContainerCompositeMembers
    >
  : ReduxModuleTypeContainer<
      TPath,
      TReduxModuleTypeContainer['_stateType'],
      TReduxModuleTypeContainer['_actionType'],
      TReduxModuleTypeContainer['_actionCreatorType'],
      TReduxModuleTypeContainer['_initializerType']
    >;

type ReduxModuleTypeContainerWithState<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TState
> = TReduxModuleTypeContainer extends ReduxModuleTypeContainerComposite<
  infer TReduxModuleTypeContainerCompositePrimary,
  infer TReduxModuleTypeContainerCompositeMembers
>
  ? ReduxModuleTypeContainerComposite<
      ReduxModuleTypeContainerWithState<
        TReduxModuleTypeContainerCompositePrimary,
        TState
      >,
      TReduxModuleTypeContainerCompositeMembers
    >
  : ReduxModuleTypeContainer<
      TReduxModuleTypeContainer['_pathType'],
      TState,
      TReduxModuleTypeContainer['_actionType'],
      TReduxModuleTypeContainer['_actionCreatorType'],
      TReduxModuleTypeContainer['_initializerType']
    >;

type ReduxModuleTypeContainerWithAction<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TAction extends Action
> = TReduxModuleTypeContainer extends ReduxModuleTypeContainerComposite<
  infer TReduxModuleTypeContainerCompositePrimary,
  infer TReduxModuleTypeContainerCompositeMembers
>
  ? ReduxModuleTypeContainerComposite<
      ReduxModuleTypeContainerWithAction<
        TReduxModuleTypeContainerCompositePrimary,
        TAction
      >,
      TReduxModuleTypeContainerCompositeMembers
    >
  : ReduxModuleTypeContainer<
      TReduxModuleTypeContainer['_pathType'],
      TReduxModuleTypeContainer['_stateType'],
      TAction,
      TReduxModuleTypeContainer['_actionCreatorType'],
      TReduxModuleTypeContainer['_initializerType']
    >;

type ReduxModuleTypeContainerWithInitializer<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TInitializer extends ModuleInitializer<any, any>
> = TReduxModuleTypeContainer extends ReduxModuleTypeContainerComposite<
  infer TReduxModuleTypeContainerCompositePrimary,
  infer TReduxModuleTypeContainerCompositeMembers
>
  ? ReduxModuleTypeContainerComposite<
      ReduxModuleTypeContainerWithInitializer<
        TReduxModuleTypeContainerCompositePrimary,
        TInitializer
      >,
      TReduxModuleTypeContainerCompositeMembers
    >
  : ReduxModuleTypeContainer<
      TReduxModuleTypeContainer['_pathType'],
      TReduxModuleTypeContainer['_stateType'],
      TReduxModuleTypeContainer['_actionType'],
      TReduxModuleTypeContainer['_actionCreatorType'],
      TInitializer
    >;

export type ReduxModuleTypeContainerNameOnly<TPath extends string> =
  ReduxModuleTypeContainerWithPath<ReduxModuleTypeContainerUnamed, TPath>;

export type ReduxModuleTypeContainerNameAndInitializerOnly<
  TPath extends string,
  TInitializer extends (prop: any) => any
> = ReduxModuleTypeContainerWithInitializer<
  ReduxModuleTypeContainerNameOnly<TPath>,
  TInitializer
>;

// export type ReduxModuleTypeContainerWithInitializationPropsProvided<
//   TReduxModule extends ReduxModuleTypeContainerAny,
//   TPropsWhichWereProvided,
//   TRemainingProps = Optional<
//     TReduxModule['_initializerPropsType'],
//     keyof TPropsWhichWereProvided
//   >
// > = ReduxModuleTypeContainerWithInitializer<
//   TReduxModule,
//   (props: TRemainingProps) => TRemainingProps
// >;

// type ReduxModuleTypeContainerInitializerWithInitializationPropsProvider<TInitializer extends ModuleInitializer<any, any>, TPropsWhichWereProvided, >
//   =

export type ReduxModuleTypeContainerWithInitializationPropsProvided<
  TReduxModule extends ReduxModuleTypeContainerAny,
  TPropsWhichWereProvided,
  TRemainingProps = Optional<
    TReduxModule['_initializerPropsType'],
    keyof TPropsWhichWereProvided
  >
> = TReduxModule extends ReduxModuleTypeContainerComposite<
  infer TReduxModuleTypeContainerCompositePrimary,
  infer ReduxModuleTypeContainerCompositeMembers
>
  ? ReduxModuleTypeContainerComposite<
      ReduxModuleTypeContainerWithInitializationPropsProvided<
        TReduxModuleTypeContainerCompositePrimary,
        TPropsWhichWereProvided
      >,
      ReduxModuleTypeContainerWithInitializationPropsProvided<
        ReduxModuleTypeContainerCompositeMembers,
        TPropsWhichWereProvided
      >
    >
  : ReduxModuleTypeContainerWithInitializer<
      TReduxModule,
      (props: TRemainingProps) => TRemainingProps
    >;

export type ReduxModuleTypeContainerCompositeAny =
  ReduxModuleTypeContainerComposite<
    ReduxModuleTypeContainerAny,
    ReduxModuleTypeContainerAny
  >;

export type ReduxModuleTypeContainerCombinedWith<
  TReduxModuleTypeContainerTarget extends ReduxModuleTypeContainerAny,
  TReduxModuleTypeContainerSource extends ReduxModuleTypeContainerAny
> = TReduxModuleTypeContainerTarget extends ReduxModuleTypeContainerComposite<
  infer TTargetReduxModule,
  infer TTargetReduxModules
>
  ? // Target is a composite module
    TReduxModuleTypeContainerSource extends ReduxModuleTypeContainerComposite<
      infer TSourceReduxModule,
      infer TSourceReduxModules
    >
    ? // Source is a composite module
      ReduxModuleTypeContainerCombinedWith<
        ReduxModuleTypeContainerCombinedWith<
          TTargetReduxModule,
          TSourceReduxModule
        >,
        TTargetReduxModules | TSourceReduxModules
      >
    : // Source is not a composite module
    TTargetReduxModule['_pathType'] extends TReduxModuleTypeContainerSource['_pathType']
    ? // Replacing the primary module
      ReduxModuleTypeContainerComposite<
        TReduxModuleTypeContainerSource,
        TTargetReduxModules
      >
    : // Replace module in the union type by path, keeping the primary module
      ReduxModuleTypeContainerComposite<
        TTargetReduxModule,
        | TReduxModuleTypeContainerSource
        | (TTargetReduxModules['_pathType'] extends TReduxModuleTypeContainerSource['_pathType']
            ? never
            : TTargetReduxModules)
      >
  : // Target is not a composite module
  TReduxModuleTypeContainerTarget['_pathType'] extends TReduxModuleTypeContainerSource['_pathType']
  ? // Source and Target have the same path
    TReduxModuleTypeContainerSource
  : // Source and Target have different paths
    ReduxModuleTypeContainerComposite<
      TReduxModuleTypeContainerTarget,
      TReduxModuleTypeContainerSource
    >;

/**
 * ReduxModule function types
 */
type PreloadedStateFunctionType<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> = IsAny<
  TReduxModuleTypeContainer['_pathType'],
  (
    preloadedState: any
  ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>,
  unknown extends TReduxModuleTypeContainer['_stateType']
    ? <TPreloadedState>(
        preloadedState: TPreloadedState
      ) => ReduxModuleMayRequireInitialization<
        ReduxModuleTypeContainerWithState<
          TReduxModuleTypeContainer,
          TPreloadedState
        >
      >
    : (
        preloadedState: Partial<TReduxModuleTypeContainer['_stateType']>
      ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>
>;

type ReduceFunctionType<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> = IsAny<
  TReduxModuleTypeContainer['_pathType'],
  (
    reducer: ReduxModuleReducer<ReduxModuleTypeContainerCompositeAny>
  ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>,
  true extends $AND<
    TypeEqual<unknown, TReduxModuleTypeContainer['_stateType']>,
    TypeEqual<unknown, TReduxModuleTypeContainer['_actionType']>
  >
    ? // TState and TAction are unknown
      <
        TReducer extends ReduxModuleReducer<
          ReduxModuleTypeContainerWithAction<
            ReduxModuleTypeContainerWithState<TReduxModuleTypeContainer, any>,
            any
          >
        >,
        TReducerState = StateFromReducer<TReducer>,
        TReducerAction extends Action = ActionFromReducer<TReducer>
      >(
        reducer: TReducer
      ) => ReduxModuleMayRequireInitialization<
        ReduxModuleTypeContainerWithAction<
          ReduxModuleTypeContainerWithState<
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
          ReduxModuleTypeContainerWithState<TReduxModuleTypeContainer, any>
        >,
        TReducerState = StateFromReducer<TReducer>
      >(
        reducer: TReducer
      ) => ReduxModuleMayRequireInitialization<
        ReduxModuleTypeContainerWithState<
          TReduxModuleTypeContainer,
          TReducerState
        >
      >
    : true extends TypeEqual<unknown, TReduxModuleTypeContainer['_actionType']>
    ? // TAction is unkown, infer TAction from TReducer
      <
        TReducer extends ReduxModuleReducer<
          ReduxModuleTypeContainerWithAction<TReduxModuleTypeContainer, any>
        >,
        TReducerAction extends Action = ActionFromReducer<TReducer>
      >(
        reducer: TReducer
      ) => ReduxModuleMayRequireInitialization<
        ReduxModuleTypeContainerWithAction<
          TReduxModuleTypeContainer,
          TReducerAction
        >
      >
    : // TReducer should conform to existing types
      (
        reducer: ReduxModuleReducer<TReduxModuleTypeContainer>
      ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>
>;

type OnFunctionType<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> = IsAny<
  TReduxModuleTypeContainer['_pathType'],
  (
    typeOrHandler: ReduxModuleMiddleware<TReduxModuleTypeContainer> | string,
    handler?: ReduxModuleMiddleware<TReduxModuleTypeContainer>
  ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>,
  unknown extends TReduxModuleTypeContainer['_actionType']
    ? // infer TAction from TMiddleware
      <
        TMiddleware extends ReduxModuleMiddleware<
          ReduxModuleTypeContainerWithAction<TReduxModuleTypeContainer, any>
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
        ReduxModuleTypeContainerWithAction<
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
          ReduxModuleTypeContainerWithAction<
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
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TInterceptor extends Interceptor<Action, any, any, any> = Interceptor<
    Action,
    TReduxModuleTypeContainer['_storeStateType'],
    TReduxModuleTypeContainer['_storeActionCreatorsType'],
    TReduxModuleTypeContainer['_initializerRequiredPropsType']
  >
> = IsAny<
  TReduxModuleTypeContainer['_pathType'],
  (
    interceptor: Interceptor<
      TReduxModuleTypeContainer['_actionType'],
      TReduxModuleTypeContainer['_storeStateType'],
      TReduxModuleTypeContainer['_storeActionCreatorsType'],
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
            ReduxModuleTypeContainerWithAction<
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
          TReduxModuleTypeContainer['_storeActionCreatorsType'],
          TReduxModuleTypeContainer['_initializerRequiredPropsType']
        >
      ) => ReduxModuleMayRequireInitialization<TReduxModuleTypeContainer>
>;

export interface ReduxModule<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> {
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
  with<OtherModule extends ReduxModule<ReduxModuleTypeContainerAny>>(
    module: OtherModule
  ): OtherModule extends ReduxModule<infer TWReduxModule>
    ? TWReduxModule extends ReduxModuleTypeContainerAny
      ? ReduxModuleMayRequireInitialization<
          ReduxModuleTypeContainerCombinedWith<
            TReduxModuleTypeContainer,
            TWReduxModule
          >
        >
      : never
    : never;
}

/**
 * Types for initialize method
 */

/**
 * T is the provided type
 * K is the type which T must only have keys of
 */
type MustOnlyHaveKeys<T, K> = {} extends Omit<T, keyof K> ? Partial<T> : K;

/**
 * Provided module props.
 */
export type ProvidedModuleProps<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TProps = any
> =
  | ((context?: {
      actions: TReduxModuleTypeContainer['_storeActionCreatorsType'];
    }) => TProps)
  | TProps;

/**
 * Interface for a redux module which requires initialization before it can be made into a store.
 */
export interface ReduxModuleRequiresInitialization<
  TReduxModule extends ReduxModuleTypeContainerAny
> extends ReduxModule<TReduxModule> {
  initialize<TProps>(
    props: ProvidedModuleProps<
      TReduxModule,
      MustOnlyHaveKeys<TProps, TReduxModule['_initializerPropsType']>
    >
  ): ReduxModuleMayRequireInitialization<
    ReduxModuleTypeContainerWithInitializationPropsProvided<
      TReduxModule,
      TProps
    >
  >;
}

/**
 * Interface for a redux module which is fully initialized.
 */
export interface ReduxModuleFullyInitialized<
  TReduxModule extends ReduxModuleTypeContainerAny
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
  TReduxModule extends ReduxModuleTypeContainerAny,
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
  TReduxModule extends ReduxModuleTypeContainerAny
> =
  | ReduxModuleFullyInitialized<TReduxModule>
  | ReduxModuleRequiresInitialization<TReduxModule>;
