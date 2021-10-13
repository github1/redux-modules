import { Action } from 'redux';
import { ActionTypeContainsSubstring } from './type-helpers';

export function isAction<
  TAction extends Action,
  TSubString extends string,
  TMatchingAction = ActionTypeContainsSubstring<TAction, TSubString>
>(
  action: TAction,
  type: TSubString
): action is TAction extends TMatchingAction ? TAction : never {
  const parts = type.split('*');
  if (!action || !action.type) {
    return false;
  }
  while (parts.length > 0) {
    if (!action.type.includes(parts.shift())) {
      return false;
    }
  }
  return true;
}
