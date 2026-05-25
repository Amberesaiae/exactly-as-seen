import { setup, assign } from 'xstate';

export interface BatchContext {
  batchId: string;
  species: 'broiler' | 'layer' | 'duck' | 'turkey' | 'other';
  duckType: 'meat' | 'layer' | null;
  productionSystem: 'intensive' | 'semi_intensive';
  currentWeek: number;
  cycleLengthWeeks: number;
  hasActiveWithdrawal: boolean;
}

export type BatchEvent =
  | { type: 'START_BATCH' }
  | { type: 'ADVANCE_WEEK'; expectedCurrentWeek: number }
  | { type: 'ENTER_WITHDRAWAL' }
  | { type: 'CLEAR_WITHDRAWAL' }
  | { type: 'TERMINATE_NORMAL' }
  | { type: 'EMERGENCY_TERMINATE'; reason?: string };

// Phase boundary table (CONVENTIONS §2.4–2.8)
export const PHASE_BOUNDARIES: Record<string, { brooding: number; starter: number; grower: number; finisher: number }> = {
  broiler:        { brooding: 1, starter: 3, grower: 5, finisher: 8  },
  layer:          { brooding: 4, starter: 8, grower: 18, finisher: 78 },
  duck_meat:      { brooding: 1, starter: 3, grower: 6, finisher: 10 },
  duck_layer:     { brooding: 4, starter: 8, grower: 19, finisher: 78 },
  turkey:         { brooding: 4, starter: 8, grower: 12, finisher: 16 },
  other:          { brooding: 2, starter: 6, grower: 12, finisher: 24 },
};

export function boundaryKey(ctx: BatchContext): string {
  if (ctx.species === 'duck') return ctx.duckType === 'layer' ? 'duck_layer' : 'duck_meat';
  return ctx.species;
}

export const batchMachine = setup({
  types: {
    context: {} as BatchContext,
    events: {} as BatchEvent,
  },
  guards: {
    weekIs: ({ context, event }) =>
      event.type === 'ADVANCE_WEEK' && event.expectedCurrentWeek === context.currentWeek,
    pastBrooding: ({ context }) => {
      const bk = boundaryKey(context);
      const bounds = PHASE_BOUNDARIES[bk] || PHASE_BOUNDARIES.other;
      return context.currentWeek > bounds.brooding;
    },
    pastStarter: ({ context }) => {
      const bk = boundaryKey(context);
      const bounds = PHASE_BOUNDARIES[bk] || PHASE_BOUNDARIES.other;
      return context.currentWeek > bounds.starter;
    },
    pastGrower: ({ context }) => {
      const bk = boundaryKey(context);
      const bounds = PHASE_BOUNDARIES[bk] || PHASE_BOUNDARIES.other;
      return context.currentWeek > bounds.grower;
    },
    pastFinisher: ({ context }) => {
      const bk = boundaryKey(context);
      const bounds = PHASE_BOUNDARIES[bk] || PHASE_BOUNDARIES.other;
      return context.currentWeek >= bounds.finisher;
    },
    noActiveWithdrawal: ({ context }) => !context.hasActiveWithdrawal,
  },
  actions: {
    incrementWeek: assign({
      currentWeek: ({ context }) => context.currentWeek + 1,
    }),
  },
}).createMachine({
  id: 'batch',
  initial: 'created',
  context: ({ input }: any) => input,
  states: {
    created: {
      on: {
        START_BATCH: 'brooding',
      },
    },
    brooding: {
      on: {
        ADVANCE_WEEK: {
          guard: 'weekIs',
          actions: 'incrementWeek',
        },
        ENTER_WITHDRAWAL: 'withdrawal',
        EMERGENCY_TERMINATE: 'terminated',
      },
      always: [
        { guard: 'pastBrooding', target: 'starter' },
      ],
    },
    starter: {
      on: {
        ADVANCE_WEEK: {
          guard: 'weekIs',
          actions: 'incrementWeek',
        },
        ENTER_WITHDRAWAL: 'withdrawal',
        EMERGENCY_TERMINATE: 'terminated',
      },
      always: [
        { guard: 'pastStarter', target: 'grower' },
      ],
    },
    grower: {
      on: {
        ADVANCE_WEEK: {
          guard: 'weekIs',
          actions: 'incrementWeek',
        },
        ENTER_WITHDRAWAL: 'withdrawal',
        EMERGENCY_TERMINATE: 'terminated',
      },
      always: [
        { guard: 'pastGrower', target: 'finisher' },
      ],
    },
    finisher: {
      on: {
        ADVANCE_WEEK: {
          guard: 'weekIs',
          actions: 'incrementWeek',
        },
        ENTER_WITHDRAWAL: 'withdrawal',
        TERMINATE_NORMAL: {
          guard: 'noActiveWithdrawal',
          target: 'ready_to_sell',
        },
        EMERGENCY_TERMINATE: 'terminated',
      },
    },
    withdrawal: {
      on: {
        CLEAR_WITHDRAWAL: 'ready_to_sell',
        EMERGENCY_TERMINATE: 'terminated',
      },
    },
    ready_to_sell: {
      on: {
        TERMINATE_NORMAL: 'terminated',
        EMERGENCY_TERMINATE: 'terminated',
      },
    },
    terminated: {
      type: 'final',
    },
  },
});
