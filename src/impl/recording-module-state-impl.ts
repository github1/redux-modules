import { Action } from 'redux';
import {
  RecordingModuleState,
  RecordingModuleWaitCondition,
  RecordingStoreState,
} from '../recording-module';
import { Handler, Predicate } from '../utils';
import { ReduxModuleMiddleware } from '../redux-module-middleware';
import { ReduxModuleTypeContainer } from '../redux-module';

export function RecordingModuleMiddleware<
  TAction extends Action
>(): ReduxModuleMiddleware<
  ReduxModuleTypeContainer<
    'recording',
    RecordingModuleState<TAction>,
    TAction,
    any,
    any
  >
> {
  return (store) => (next) => (action) => {
    next(action);
    store
      .getState()
      .recording.waitConditions.filter(
        (waitCondition) => !waitCondition.isResolved
      )
      .forEach((waitCondition) => {
        if (waitCondition.predicate(store.getState().recording, action)) {
          waitCondition.resolve();
        }
      });
  };
}

function isActionMatch(
  action: Action,
  test: string | Predicate<Action>
): boolean {
  return (
    action && (typeof test === 'string' ? action.type === test : test(action))
  );
}

export class RecordingModuleStateImpl<TAction extends Action>
  implements RecordingModuleState<TAction>
{
  public waitConditions: RecordingModuleWaitCondition<TAction>[] = [];
  constructor(public readonly actions: TAction[] = []) {}
  public find(
    typeOrPredicate: TAction['type'] | Predicate<TAction>,
    handler?: Handler<TAction[]>
  ): TAction[] {
    const found = this.actions.filter((action) =>
      isActionMatch(action, typeOrPredicate)
    );
    if (handler) {
      handler(found);
    }
    return found;
  }
  public contains(
    typeOrPredicate: TAction['type'] | Predicate<TAction>
  ): boolean {
    return this.find(typeOrPredicate).length > 0;
  }
  public async waitForCondition(
    predicate: Predicate<RecordingStoreState<TAction>['recording'], Action>,
    timeout: number = 20000
  ): Promise<void> {
    // check if the condition matches already
    if (this.actions.filter((action) => predicate(this, action)).length > 0) {
      return Promise.resolve();
    }

    let promiseResolve: () => void;
    let promiseReject: (reason: any) => void;
    const promise = new Promise<void>((resolve, reject) => {
      promiseResolve = resolve;
      promiseReject = reject;
    });
    const timeoutTimer = setTimeout(() => {
      if (!waitCondition.isResolved) {
        waitCondition.isResolved = true;
        promiseReject(new Error(`Exceeded timeout of ${timeout}`));
      }
    }, timeout);
    const waitCondition = {
      isResolved: false,
      predicate,
      resolve: () => {
        clearTimeout(timeoutTimer);
        waitCondition.isResolved = true;
        promiseResolve();
      },
    };
    this.waitConditions = this.waitConditions.filter(
      (waitCondition) => !waitCondition.isResolved
    );
    this.waitConditions.push(waitCondition);
    while (!waitCondition.isResolved) {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
    return promise;
  }
  public async waitFor(
    typeOrPredicate: TAction['type'] | Predicate<TAction>,
    timeout: number = 20000
  ): Promise<TAction[]> {
    await this.waitForCondition((state, action) => {
      return isActionMatch(action, typeOrPredicate);
    }, timeout);
    return this.find(typeOrPredicate);
  }
}
