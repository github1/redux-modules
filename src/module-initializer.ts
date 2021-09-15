import { $AND, $OR, LengthOfTuple } from './utils';
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

// TypeOf<ModuleInitializerPropsType<TInitializer>, {}>

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

export type ModuleInitializerCombined<TInitializerA, TInitializerB> =
  true extends $AND<
    ModuleInitializerRequiresProps<TInitializerA, true, false>,
    ModuleInitializerRequiresProps<TInitializerB, true, false>
  >
    ? ModuleInitializer<
        ModuleInitializerPropsType<TInitializerA> &
          ModuleInitializerPropsType<TInitializerB>
      >
    : true extends $AND<
        ModuleInitializerRequiresProps<TInitializerA, true, false>,
        ModuleInitializerRequiresProps<TInitializerB, false, true>
      >
    ? TInitializerA
    : true extends $AND<
        ModuleInitializerRequiresProps<TInitializerA, false, true>,
        ModuleInitializerRequiresProps<TInitializerB, true, false>
      >
    ? TInitializerB
    : undefined;
