import { isAction } from './is-action';

describe('is-action', () => {
  it('guards action types', () => {
    expect(isAction({ type: 'FOO' }, 'FOO')).toBe(true);
    expect(isAction({ type: 'FOO' }, 'BAR')).toBe(false);
  });
  it('does not fail for invalid actions', () => {
    expect(isAction('asds' as any, 'SOMETHING')).toBe(false);
    expect(isAction({ type: 123 } as any, 'SOMETHING')).toBe(false);
  });
});
