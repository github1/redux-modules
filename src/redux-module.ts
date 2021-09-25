import { Action } from 'redux';
import { TypeEqual } from 'ts-expect';
import {
  ActionFromReducer,
  ActionTypeContainsSubstring,
  StateFromReducer,
  StoreStateAtPath,
} from './type-helpers';
import { PostConfigure } from './post-configure';
import { ReduxModuleStoreOptions } from './redux-module-store-options';
import { ReduxModuleMiddleware } from './redux-module-middleware';
import { StoreFromOptions } from './store-from-options';
import { ReduxModuleReducer } from './redux-module-reducer';
import {
  $AND,
  $OR,
  IsAny,
  IsStrictlyAny,
  LastInTuple,
  Optional,
  ToTuple,
  UnionToIntersection,
} from './utils';
import { ThunkAction } from 'redux-thunk';

export type ReduxModuleTypeContainer<
  TPath extends string,
  TState,
  TAction extends Action,
  TActionCreators extends Record<string, (...args: any) => TAction> = undefined,
  TProps = never,
  TPathTuple extends string[] = IsAny<
    TPath,
    any,
    ToTuple<TPath, '.' | '/' | '->'>
  >
> = {
  _pathType: TPath;
  _pathTupleType: TPathTuple;
  _nameType: LastInTuple<TPathTuple>;
  _stateType: TState;
  _actionType: TAction;
  _actionCreatorType: TActionCreators;
  _initializerRequiredPropsType: Required<TProps>;
  _initializerPropsType: TProps;
  _storeStateType: StoreStateAtPath<TState, TPath>;
  _storeActionCreatorsType: StoreStateAtPath<TActionCreators, TPath>;
  _storeActionCreatorsWithLocalType: TActionCreators &
    StoreStateAtPath<TActionCreators, TPath>;
};

export type ReduxModuleTypeContainerAny = ReduxModuleTypeContainer<
  any, // path
  any, // state
  any, // action
  any, // actionCreator
  any // props
>;

type ReduxModuleTypeContainerActionIsUndefined<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> = $OR<
  TReduxModuleTypeContainer['_actionType'] extends undefined ? true : false,
  IsStrictlyAny<TReduxModuleTypeContainer['_actionType']>
>;

type ReduxModuleTypeContainerStateIsUndefined<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> = $OR<
  TReduxModuleTypeContainer['_stateType'] extends undefined ? true : false,
  IsStrictlyAny<TReduxModuleTypeContainer['_stateType']>
>;

export type ReduxModuleTypeContainerComposite<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TReduxModuleTypeContainerMembers extends ReduxModuleTypeContainerAny = never,
  TReduxModuleTypeContainerMembersAll extends ReduxModuleTypeContainerAny =
    | TReduxModuleTypeContainer
    | TReduxModuleTypeContainerMembers,
  TReduxModuleTypeContainerMembersAllProps = UnionToIntersection<
    TReduxModuleTypeContainerMembersAll['_initializerPropsType']
  >
> = ReduxModuleTypeContainer<
  TReduxModuleTypeContainer['_pathType'],
  TReduxModuleTypeContainer['_stateType'],
  TReduxModuleTypeContainerMembersAll['_actionType'],
  TReduxModuleTypeContainer['_actionCreatorType'],
  TReduxModuleTypeContainerMembersAllProps
> & {
  _modules: TReduxModuleTypeContainerMembersAll;
  _members: TReduxModuleTypeContainerMembers;
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

export type ReduxModuleTypeContainerUnnamed = ReduxModuleTypeContainer<
  '_', // path
  undefined, // state
  undefined // action
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
      TReduxModuleTypeContainer['_initializerPropsType']
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
      TReduxModuleTypeContainer['_initializerPropsType']
    >;

export type ReduxModuleTypeContainerWithAction<
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
      TReduxModuleTypeContainer['_initializerPropsType']
    >;

export type ReduxModuleTypeContainerWithActionMatchingSubstring<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TSubString extends string
> = TReduxModuleTypeContainer extends ReduxModuleTypeContainerComposite<
  infer TReduxModuleTypeContainerCompositePrimary,
  infer TReduxModuleTypeContainerCompositeMembers
>
  ? ReduxModuleTypeContainerComposite<
      ReduxModuleTypeContainerWithAction<
        TReduxModuleTypeContainerCompositePrimary,
        ActionTypeContainsSubstring<
          TReduxModuleTypeContainerCompositePrimary['_actionType'],
          TSubString
        >
      >,
      ReduxModuleTypeContainerWithAction<
        TReduxModuleTypeContainerCompositeMembers,
        ActionTypeContainsSubstring<
          TReduxModuleTypeContainerCompositeMembers['_actionType'],
          TSubString
        >
      >
    >
  : ReduxModuleTypeContainer<
      TReduxModuleTypeContainer['_pathType'],
      TReduxModuleTypeContainer['_stateType'],
      ActionTypeContainsSubstring<
        TReduxModuleTypeContainer['_actionType'],
        TSubString
      >,
      TReduxModuleTypeContainer['_actionCreatorType'],
      TReduxModuleTypeContainer['_initializerPropsType']
    >;

export type ReduxModuleTypeContainerWithActionCreator<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TActionCreator extends Record<string, (...args: any) => Action>
> = TReduxModuleTypeContainer extends ReduxModuleTypeContainerComposite<
  infer TReduxModuleTypeContainerCompositePrimary,
  infer TReduxModuleTypeContainerCompositeMembers
>
  ? ReduxModuleTypeContainerComposite<
      ReduxModuleTypeContainerWithActionCreator<
        TReduxModuleTypeContainerCompositePrimary,
        TActionCreator
      >,
      TReduxModuleTypeContainerCompositeMembers
    >
  : ReduxModuleTypeContainer<
      TReduxModuleTypeContainer['_pathType'],
      TReduxModuleTypeContainer['_stateType'],
      TReduxModuleTypeContainer['_actionType'],
      TActionCreator,
      TReduxModuleTypeContainer['_initializerPropsType']
    >;

export type ReduxModuleTypeContainerWithProps<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TProps
> = TReduxModuleTypeContainer extends ReduxModuleTypeContainerComposite<
  infer TReduxModuleTypeContainerCompositePrimary,
  infer TReduxModuleTypeContainerCompositeMembers
>
  ? ReduxModuleTypeContainerComposite<
      ReduxModuleTypeContainerWithProps<
        TReduxModuleTypeContainerCompositePrimary,
        TProps
      >,
      TReduxModuleTypeContainerCompositeMembers
    >
  : ReduxModuleTypeContainer<
      TReduxModuleTypeContainer['_pathType'],
      TReduxModuleTypeContainer['_stateType'],
      TReduxModuleTypeContainer['_actionType'],
      TReduxModuleTypeContainer['_actionCreatorType'],
      TProps
    >;

export type ReduxModuleTypeContainerNameOnly<TPath extends string> =
  ReduxModuleTypeContainerWithPath<ReduxModuleTypeContainerUnnamed, TPath>;

export type ReduxModuleTypeContainerNameAndPropsOnly<
  TPath extends string,
  TProps
> = ReduxModuleTypeContainerWithProps<
  ReduxModuleTypeContainerNameOnly<TPath>,
  TProps
>;

export type ReduxModuleTypeContainerWithInitializationPropsProvided<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TPropsWhichWereProvided,
  TRemainingProps = Optional<
    TReduxModuleTypeContainer['_initializerPropsType'],
    keyof TPropsWhichWereProvided
  >
> = TReduxModuleTypeContainer extends ReduxModuleTypeContainerComposite<
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
  : ReduxModuleTypeContainerWithProps<
      TReduxModuleTypeContainer,
      TRemainingProps
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
  true extends ReduxModuleTypeContainerStateIsUndefined<TReduxModuleTypeContainer>
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
    TypeEqual<undefined, TReduxModuleTypeContainer['_stateType']>,
    TypeEqual<undefined, TReduxModuleTypeContainer['_actionType']>
  >
    ? // TState and TAction are undefined
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
    : true extends TypeEqual<undefined, TReduxModuleTypeContainer['_stateType']>
    ? // TState is undefined, infer it from TReducer
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
    : true extends TypeEqual<
        undefined,
        TReduxModuleTypeContainer['_actionType']
      >
    ? // TAction is undefined, infer TAction from TReducer
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
  true extends ReduxModuleTypeContainerActionIsUndefined<TReduxModuleTypeContainer>
    ? // infer TAction from TMiddleware
      <
        TMiddleware extends ReduxModuleMiddleware<
          ReduxModuleTypeContainerWithAction<TReduxModuleTypeContainer, any>
        >,
        TActionTypeOrMiddleware extends TMiddleware | string,
        TActionFromMiddleware extends Action = Extract<
          TActionTypeOrMiddleware extends (
            ...store: any
          ) => (...next: any) => (action: infer TMiddlewareActionType) => void
            ? TMiddlewareActionType
            : TReduxModuleTypeContainer['_actionType'],
          Action
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
        TReduxModuleMiddleware extends ReduxModuleMiddleware<
          ReduxModuleTypeContainerWithActionMatchingSubstring<
            TReduxModuleTypeContainer,
            TActionTypeOrMiddleware extends string
              ? TActionTypeOrMiddleware
              : never
          >
        >
      >(
        type: TActionTypeOrMiddleware,
        handler?: TReduxModuleMiddleware
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
  true extends ReduxModuleTypeContainerActionIsUndefined<TReduxModuleTypeContainer>
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
  readonly path: TReduxModuleTypeContainer['_pathTupleType'];
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
  readonly modules: TReduxModuleTypeContainer extends ReduxModuleTypeContainerComposite<
    any,
    infer TReduxModuleTypeContainerMembers
  >
    ? UnionToIntersection<
        ReduxModuleFromReduxModuleTypeContainerHavingPath<TReduxModuleTypeContainerMembers>
      >
    : {};
}

type ReduxModuleFromReduxModuleTypeContainerHavingPath<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> = TReduxModuleTypeContainer extends ReduxModuleTypeContainerWithPath<
  ReduxModuleTypeContainerAny,
  infer TPath
>
  ? StoreStateAtPath<ReduxModule<TReduxModuleTypeContainer>, TPath>
  : never;

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
      actions: TReduxModuleTypeContainer['_storeActionCreatorsWithLocalType'];
    }) => TProps)
  | TProps;

/**
 * Interface for a redux module which requires initialization before it can be made into a store.
 */
export interface ReduxModuleRequiresInitialization<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> extends ReduxModule<TReduxModuleTypeContainer> {
  initialize<TProps>(
    props: ProvidedModuleProps<
      TReduxModuleTypeContainer,
      MustOnlyHaveKeys<
        TProps,
        TReduxModuleTypeContainer['_initializerPropsType']
      >
    >
  ): ReduxModuleMayRequireInitialization<
    ReduxModuleTypeContainerWithInitializationPropsProvided<
      TReduxModuleTypeContainer,
      TProps
    >
  >;
}

/**
 * Interface for a redux module which is fully initialized.
 */
export interface ReduxModuleFullyInitialized<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> extends ReduxModule<TReduxModuleTypeContainer> {
  asStore<
    TReduxModuleStoreOptions extends ReduxModuleStoreOptions<
      TReduxModuleTypeContainer['_storeStateType']
    >
  >(
    options?: TReduxModuleStoreOptions
  ): StoreFromOptions<TReduxModuleTypeContainer, TReduxModuleStoreOptions>;
}

/**
 * Type of a redux module which yields either a ReduxModuleRequiresInitialization
 * or ReduxModuleFullyInitialized whether initialization props have been supplied.
 */
export type ReduxModuleMayRequireInitialization<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny,
  TReduxModuleFullyInitialized = ReduxModuleFullyInitialized<TReduxModuleTypeContainer>,
  TReduxModuleRequiresInitialization = ReduxModuleRequiresInitialization<TReduxModuleTypeContainer>
> = IsAny<
  TReduxModuleTypeContainer['_pathType'],
  ReduxModule<TReduxModuleTypeContainer>,
  TReduxModuleTypeContainer['_initializerPropsType'] extends undefined
    ? TReduxModuleFullyInitialized
    : {} extends TReduxModuleTypeContainer['_initializerPropsType']
    ? {} extends Required<TReduxModuleTypeContainer['_initializerPropsType']>
      ? TReduxModuleFullyInitialized
      : // only has optional props, allow it to set props or create store
        ReduxModuleRequiresInitializationOrFullyInitialized<TReduxModuleTypeContainer>
    : TReduxModuleRequiresInitialization
>;

export type ReduxModuleRequiresInitializationOrFullyInitialized<
  TReduxModuleTypeContainer extends ReduxModuleTypeContainerAny
> = ReduxModuleFullyInitialized<TReduxModuleTypeContainer> &
  ReduxModuleRequiresInitialization<TReduxModuleTypeContainer>;
