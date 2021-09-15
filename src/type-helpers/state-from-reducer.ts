export type StateFromReducer<TReducer> = TReducer extends (
  state: infer TReducerState,
  ...rest: any[]
) => any // infer TReducerState from state argument type not the return type @TODO - also check return type?
  ? TReducerState
  : 'never';
