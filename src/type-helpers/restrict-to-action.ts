import { Action } from 'redux';

export type RestrictToAction<
  TMaybeAction,
  TDefault extends Action = never
> = TMaybeAction extends Action ? TMaybeAction : TDefault;
