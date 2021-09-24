export type ModuleInitializerPropsType<TInitializer> = TInitializer extends (
  ...args: any
) => infer TProps
  ? TProps
  : {};

export type ModuleInitializer<
  TPropsInput extends {},
  TProps extends TPropsInput = TPropsInput
> = ((props: TPropsInput) => TProps) | undefined
