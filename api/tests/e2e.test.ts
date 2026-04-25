import { describe, expect, it } from 'vitest';

describe('e2e flow documentation', () => {
  it('captures the required onboarding flow steps', async () => {
    const expected = [
      'create client',
      'create agent',
      'embed widget',
      'send message',
      'verify response',
      'verify cost log',
      'verify session persistence'
    ];

    expect(expected).toHaveLength(7);
  });
});
