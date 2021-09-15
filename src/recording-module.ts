import { Action } from 'redux';
import { Handler, Predicate } from './utils';

export type RecordingModuleWaitCondition<TAction extends Action> = {
  readonly isResolved: boolean;
  predicate: Predicate<RecordingStoreState<TAction>['recording'], Action>;
  resolve(): void;
};

export interface RecordingModuleState<TAction extends Action> {
  readonly actions: TAction[];
  readonly waitConditions: RecordingModuleWaitCondition<TAction>[];
  find<
    TFindActionType extends TAction['type'],
    TFoundAction = TAction extends Action<any>
      ? TFindActionType extends TAction['type']
        ? TAction
        : never
      : never
  >(
    type: TFindActionType,
    handler?: Handler<TFoundAction[]>
  ): TFoundAction[];
  find(predicate: Predicate<TAction>, handler?: Handler<TAction[]>): TAction[];
  contains(type: TAction['type']): boolean;
  contains(predicate: Predicate<TAction>): boolean;
  waitForCondition(
    predicate: Predicate<RecordingStoreState<TAction>['recording'], Action>,
    timeout?: number
  ): Promise<void>;
  waitFor<
    TFindActionType extends TAction['type'],
    TFoundAction = TAction extends Action<any>
      ? TFindActionType extends TAction['type']
        ? TAction
        : never
      : never
  >(
    type: TFindActionType,
    timeout?: number
  ): Promise<TFoundAction[]>;
  waitFor(predicate: Predicate<TAction>, timeout?: number): Promise<TAction[]>;
}

export interface RecordingStoreState<TAction extends Action> {
  recording: RecordingModuleState<TAction>;
}
