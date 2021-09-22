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

/**
 * Redux module type container.
 */
export type ReduxModuleTypeContainer<
  TPath extends string,
  TState,
  TAction extends Action | unknown,
  TActionCreators,
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

/**
 * Type of any redux module type container.
 */
export type ReduxModuleAny = ReduxModuleTypeContainer<
  any, // path
  any, // state
  any, // action
  any, // actionCreators
  any // initializer
>;

export type ReduxModuleUnamed = ReduxModuleTypeContainer<
  '_', // path
  unknown, // state
  unknown, // action
  unknown, // actionCreators
  undefined // initializer
>;

export type ReduxModuleNameOnly<TPath extends string> =
  ReduxModuleTypeContainer<
    TPath, // path
    unknown, // state
    unknown, // action
    unknown, // actionCreators
    undefined // initializer
  >;

export type ReduxModuleNameAndInitializerOnly<
  TPath extends string,
  TInitializer extends (prop: any) => any
> = ReduxModuleTypeContainer<
  TPath, // path
  unknown, // state
  unknown, // action
  unknown, // actionCreators
  TInitializer // initializer
>;

/**
 * Type of a redux module with the specified state type.
 */
type ReduxModuleTypeContainerWithStateType<
  TReduxModule extends ReduxModuleAny,
  TState
> = ReduxModuleCompositeWith<
  TReduxModule,
  ReduxModuleTypeContainer<
    TReduxModule['_pathType'],
    TState,
    TReduxModule['_actionType'],
    TReduxModule['_actionCreatorType'],
    TReduxModule['_initializerType']
  >
>;

/**
 * Type of a redux module with the specified action type.
 */
type ReduxModuleTypeContainerWithActionType<
  TReduxModule extends ReduxModuleAny,
  TAction
> = ReduxModuleCompositeWith<
  TReduxModule,
  ReduxModuleTypeContainer<
    TReduxModule['_pathType'],
    TReduxModule['_stateType'],
    TAction,
    TReduxModule['_actionCreatorType'],
    TReduxModule['_initializerType']
  >
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
  (props: TRemainingProps) => TRemainingProps
>;

/**
 * Redux module composite
 */
export type ReduxModuleComposite<
  TReduxModule extends ReduxModuleAny,
  TReduxModules extends ReduxModuleAny = never,
  TReduxModuleAll extends ReduxModuleAny = TReduxModule | TReduxModules
> = TReduxModule & {
  _modules: TReduxModuleAll;
  _initializerPropsType: ModuleInitializerPropsType<
    ModuleInitializerCombined<TReduxModuleAll['_initializerType']>
  >;
  _initializerRequiredPropsType: Required<
    ModuleInitializerPropsType<
      ModuleInitializerCombined<TReduxModuleAll['_initializerType']>
    >
  >;
  // TODO handle ReduxModuleComposite types in the union type
  _storeStateType: UnionToIntersection<
    TReduxModuleAll extends ReduxModuleTypeContainer<
      infer TMPath,
      infer TMState,
      any,
      any,
      any
    >
      ? StoreStateAtPath<TMState, TMPath>
      : never
  >;
  _storeActionCreatorsType: UnionToIntersection<
    TReduxModuleAll extends ReduxModuleTypeContainer<
      infer TMPath,
      any,
      any,
      infer TMActionCreator,
      any
    >
      ? StoreStateAtPath<TMActionCreator, TMPath>
      : never
  >;
};

export type ReduxModuleCompositeAny = ReduxModuleComposite<
  ReduxModuleAny,
  ReduxModuleAny
>;

/**
 * Restricts a union type of redux module type containers to the supplied path
 */
export type ReduxModuleTypeContainerAtPath<
  TReduxModuleTypeContainer extends ReduxModuleAny,
  TPath extends string
> = TReduxModuleTypeContainer extends ReduxModuleTypeContainer<
  infer TMPath,
  any,
  any,
  any,
  any
>
  ? TMPath extends TPath
    ? TReduxModuleTypeContainer
    : never
  : never;

/**
 * Exlcudes from union type of redux module type containers which have the supplied path
 */
export type ReduxModuleTypeContainerNotAtPath<
  TReduxModuleTypeContainer extends ReduxModuleAny,
  TPath extends string
> = TReduxModuleTypeContainer extends ReduxModuleTypeContainer<
  infer TMPath,
  any,
  any,
  any,
  any
>
  ? TMPath extends TPath
    ? never
    : TReduxModuleTypeContainer
  : never;

/**
 * Replaces a member module with a new module type.
 */
export type ReduxModuleCompositeWith<
  TReduxModuleTypeContainerTarget extends ReduxModuleAny,
  TReduxModuleTypeContainerSource extends ReduxModuleAny
> = TReduxModuleTypeContainerTarget extends ReduxModuleComposite<
  infer TTargetReduxModule,
  infer TTargetReduxModules
>
  ? // Target is a composite module
    TReduxModuleTypeContainerSource extends ReduxModuleComposite<
      infer TSourceReduxModule,
      infer TSourceReduxModules
    >
    ? ReduxModuleCompositeWith<
        ReduxModuleCompositeWith<TTargetReduxModule, TSourceReduxModule>,
        TTargetReduxModules | TSourceReduxModules
      >
    : TTargetReduxModule['_pathType'] extends TReduxModuleTypeContainerSource['_pathType']
    ? // Replacing the primary module
      ReduxModuleComposite<TReduxModuleTypeContainerSource, TTargetReduxModules>
    : // Replace module in the union type by path, keeping the primary module
      ReduxModuleComposite<
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
    ReduxModuleComposite<
      TReduxModuleTypeContainerTarget,
      TReduxModuleTypeContainerSource
    >;

// export type ReduxModuleCompositeWith<
//   TReduxModuleTypeContainerTarget extends ReduxModuleAny,
//   TReduxModuleTypeContainerSource extends ReduxModuleAny
// > = TReduxModuleTypeContainerTarget extends ReduxModuleComposite<
//   infer TTargetReduxModule,
//   infer TTargetReduxModules
// >
//   ? // Target is a composite module
//     TTargetReduxModule['_pathType'] extends TReduxModuleTypeContainerSource['_pathType']
//     ? // Replacing the primary module
//       ReduxModuleComposite<TReduxModuleTypeContainerSource, TTargetReduxModules>
//     : // Replace module in the union type by path, keeping the primary module
//       ReduxModuleComposite<
//         TTargetReduxModule,
//         | TReduxModuleTypeContainerSource
//         | (TTargetReduxModules['_pathType'] extends TReduxModuleTypeContainerSource['_pathType']
//             ? never
//             : TTargetReduxModules)
//       >
//   : // Target is not a composite module
//   TReduxModuleTypeContainerTarget['_pathType'] extends TReduxModuleTypeContainerSource['_pathType']
//   ? // Source and Target have the same path
//     TReduxModuleTypeContainerSource
//   : // Source and Target have different paths
//     ReduxModuleComposite<
//       TReduxModuleTypeContainerTarget,
//       TReduxModuleTypeContainerSource
//     >;

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
      reducer: ReduxModuleReducer<ReduxModuleCompositeAny>
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
          TReduxModuleTypeContainer['_storeActionCreatorsType'],
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
  with<OtherModule extends ReduxModule<ReduxModuleAny>>(
    module: OtherModule
  ): OtherModule extends ReduxModule<infer TWReduxModule>
    ? TWReduxModule extends ReduxModuleAny
      ? ReduxModuleMayRequireInitialization<
          ReduxModuleCompositeWith<TReduxModuleTypeContainer, TWReduxModule>
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
  TReduxModuleTypeContainer extends ReduxModuleAny,
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
  TReduxModule extends ReduxModuleAny
> extends ReduxModule<TReduxModule> {
  initialize<TProps>(
    props: ProvidedModuleProps<
      TReduxModule,
      MustOnlyHaveKeys<TProps, TReduxModule['_initializerPropsType']>
    >
  ): ReduxModuleMayRequireInitialization<
    ReduxModuleCompositeWith<
      TReduxModule,
      ReduxModuleTypeContainerWithInitializationPropsProvided<
        TReduxModule,
        TProps
      >
    >
  >;
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
