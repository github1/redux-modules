import { $AND, $OR, LengthOfTuple, UnionToIntersection } from './utils';
import { TypeEqual, TypeOf } from 'ts-expect';

type FirstParameterActual<TFunc> = TFunc extends (
  ...args: infer TFuncArgs
) => any
  ? 0 extends LengthOfTuple<TFuncArgs>
    ? unknown
    : TFuncArgs[0]
  : 'unknown';

export type ModuleInitializerPropsType<TInitializer> = TInitializer extends (
  ...args: any
) => infer TProps
  ? TProps
  : {};

export type ModuleInitializer<
  TPropsInput extends {},
  TProps extends TPropsInput = TPropsInput
> = ((props: TPropsInput) => TProps) | undefined;

/**
 * Checks if the initializer has required props.
 */
export type ModuleInitializerRequiresProps<TInitializer, TYes, TNo> =
  TInitializer extends (...args: any) => any
    ? true extends $OR<
        TypeEqual<TInitializer, undefined>,
        $OR<
          TypeEqual<unknown, TInitializer>,
          TypeEqual<FirstParameterActual<TInitializer>, undefined>
        >
      >
      ? TNo
      : true extends TypeOf<ModuleInitializerPropsType<TInitializer>, {}>
      ? TYes & TNo
      : TYes
    : TNo;

/**
 * Checks if the initializer has any props, including optional props.
 */
export type ModuleInitializerHasProps<TInitializer, TYes, TNo> =
  TInitializer extends (...args: any) => any
    ? true extends $OR<
        TypeEqual<TInitializer, undefined>,
        $OR<
          TypeEqual<unknown, TInitializer>,
          TypeEqual<FirstParameterActual<TInitializer>, undefined>
        >
      >
      ? TNo
      : true extends TypeOf<ModuleInitializerPropsType<TInitializer>, {}>
      ? TYes & TNo
      : TYes
    : TNo;

// export type ModuleInitializerCombined<
//   TInitializerA,
//   TInitializerB,
//   TARequiresProps = ModuleInitializerRequiresProps<TInitializerA, true, false>,
//   TBRequiresProps = ModuleInitializerRequiresProps<TInitializerB, true, false>
// > = true extends $OR<
//   $AND<TARequiresProps, TBRequiresProps>,
//   TypeEqual<true & false, TARequiresProps | TBRequiresProps>
// >
//   ? ModuleInitializer<
//       ModuleInitializerPropsType<TInitializerA> &
//         ModuleInitializerPropsType<TInitializerB>
//     >
//   : true extends TARequiresProps
//   ? TInitializerA
//   : true extends TBRequiresProps
//   ? TInitializerB
//   : undefined;

export type ModuleInitializerCombined<TInitializer> = ModuleInitializer<
  UnionToIntersection<
    true extends ModuleInitializerRequiresProps<TInitializer, true, false>
      ? ModuleInitializerPropsType<TInitializer>
      : never
  >
>;
