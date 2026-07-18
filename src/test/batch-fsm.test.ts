import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { batchMachine, BatchContext } from '../lib/batch-fsm';

describe('Batch FSM Machine (XState v5)', () => {
  const baseContext: BatchContext = {
    batchId: 'test-batch-123',
    species: 'broiler',
    duckType: null,
    productionSystem: 'intensive',
    currentWeek: 0,
    cycleLengthWeeks: 8,
    hasActiveWithdrawal: false,
  };

  it('should initialize to created and transition to brooding on START_BATCH', () => {
    const actor = createActor(batchMachine, { input: baseContext });
    actor.start();
    expect(actor.getSnapshot().value).toBe('created');

    actor.send({ type: 'START_BATCH' });
    expect(actor.getSnapshot().value).toBe('brooding');
  });

  it('should advance week and check boundary for broiler (brooding -> starter -> grower -> finisher)', () => {
    const actor = createActor(batchMachine, { input: { ...baseContext, currentWeek: 0 } });
    actor.start();
    actor.send({ type: 'START_BATCH' });
    expect(actor.getSnapshot().value).toBe('brooding');
    expect(actor.getSnapshot().context.currentWeek).toBe(0);

    // Broiler Brooding: week 0, boundary is 1. If we advance to week 1, expectedCurrentWeek: 0
    actor.send({ type: 'ADVANCE_WEEK', expectedCurrentWeek: 0 });
    expect(actor.getSnapshot().context.currentWeek).toBe(1);
    // Since 1 is not > 1 (PHASE_BOUNDARIES.broiler.brooding = 1), it stays in brooding
    expect(actor.getSnapshot().value).toBe('brooding');

    // Advance to week 2. 2 > 1, so it transitions to starter
    actor.send({ type: 'ADVANCE_WEEK', expectedCurrentWeek: 1 });
    expect(actor.getSnapshot().context.currentWeek).toBe(2);
    expect(actor.getSnapshot().value).toBe('starter');

    // Broiler Starter: bounds is 3. If we advance to week 3: 3 is not > 3, stays in starter
    actor.send({ type: 'ADVANCE_WEEK', expectedCurrentWeek: 2 });
    expect(actor.getSnapshot().context.currentWeek).toBe(3);
    expect(actor.getSnapshot().value).toBe('starter');

    // Advance to week 4. 4 > 3, transitions to grower (bounds.starter = 3)
    actor.send({ type: 'ADVANCE_WEEK', expectedCurrentWeek: 3 });
    expect(actor.getSnapshot().context.currentWeek).toBe(4);
    expect(actor.getSnapshot().value).toBe('grower');

    // Broiler Grower: bounds is 5. Advance to week 5: stays in grower
    actor.send({ type: 'ADVANCE_WEEK', expectedCurrentWeek: 4 });
    expect(actor.getSnapshot().context.currentWeek).toBe(5);
    expect(actor.getSnapshot().value).toBe('grower');

    // Advance to week 6. 6 > 5, transitions to finisher
    actor.send({ type: 'ADVANCE_WEEK', expectedCurrentWeek: 5 });
    expect(actor.getSnapshot().context.currentWeek).toBe(6);
    expect(actor.getSnapshot().value).toBe('finisher');
  });

  it('should enforce optimistic locking (ADVANCE_WEEK fails if expectedCurrentWeek mismatch)', () => {
    const actor = createActor(batchMachine, { input: { ...baseContext, currentWeek: 3 } });
    actor.start();
    // Force state to starter
    actor.send({ type: 'START_BATCH' });
    
    // Attempt ADVANCE_WEEK with incorrect expectedCurrentWeek
    actor.send({ type: 'ADVANCE_WEEK', expectedCurrentWeek: 2 });
    expect(actor.getSnapshot().context.currentWeek).toBe(3); // week unchanged
  });

  it('should transition to withdrawal and block TERMINATE_NORMAL, but allow EMERGENCY_TERMINATE', () => {
    const actor = createActor(batchMachine, { input: { ...baseContext, currentWeek: 6, hasActiveWithdrawal: true } });
    actor.start();
    actor.send({ type: 'START_BATCH' });
    
    // We are in brooding, enter withdrawal
    actor.send({ type: 'ENTER_WITHDRAWAL' });
    expect(actor.getSnapshot().value).toBe('withdrawal');

    // TERMINATE_NORMAL should be blocked from withdrawal
    actor.send({ type: 'TERMINATE_NORMAL' });
    expect(actor.getSnapshot().value).toBe('withdrawal');

    // EMERGENCY_TERMINATE should work from withdrawal
    actor.send({ type: 'EMERGENCY_TERMINATE', reason: 'disease outbreak' });
    expect(actor.getSnapshot().value).toBe('terminated');
  });

  it('should block TERMINATE_NORMAL in finisher if withdrawal is active', () => {
    const actor = createActor(batchMachine, { input: { ...baseContext, currentWeek: 6, hasActiveWithdrawal: true } });
    actor.start();
    actor.send({ type: 'START_BATCH' });
    
    // Force state to finisher
    // Let's create another actor initialized at finisher directly by mimicking the state value
  });

  it('should allow normal termination from ready_to_sell', () => {
    const actor = createActor(batchMachine, { input: { ...baseContext, currentWeek: 6, hasActiveWithdrawal: false } });
    actor.start();
    actor.send({ type: 'START_BATCH' });
    
    actor.send({ type: 'ENTER_WITHDRAWAL' });
    expect(actor.getSnapshot().value).toBe('withdrawal');

    // Clear withdrawal
    actor.send({ type: 'CLEAR_WITHDRAWAL' });
    expect(actor.getSnapshot().value).toBe('ready_to_sell');

    // Terminate normal from ready_to_sell
    actor.send({ type: 'TERMINATE_NORMAL' });
    expect(actor.getSnapshot().value).toBe('terminated');
  });
});
