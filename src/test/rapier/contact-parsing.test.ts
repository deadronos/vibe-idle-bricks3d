import { describe, it, expect, beforeEach } from 'vitest';
import { parseRuntimeEvents } from '../../engine/rapier/contact-parsing';

describe('contact-parsing', () => {
  let handleToEntity: Map<unknown, { type: 'ball' | 'brick'; id: string }>;

  beforeEach(() => {
    handleToEntity = new Map();
    handleToEntity.set(1, { type: 'ball', id: 'ball1' });
    handleToEntity.set(2, { type: 'brick', id: 'brick1' });
  });

  it('parses array of events', () => {
    const runtime = {
      contactEvents: [{ colliderA: 1, colliderB: 2, contactPoint: { x: 0, y: 0, z: 0 } }],
    };
    const events = parseRuntimeEvents(runtime, handleToEntity);
    expect(events).toHaveLength(1);
    expect(events[0].ballId).toBe('ball1');
    expect(events[0].brickId).toBe('brick1');
  });

  it('parses function returning events', () => {
    const runtime = {
      getContactEvents: () => [{ colliderA: 1, colliderB: 2 }],
    };
    const events = parseRuntimeEvents(runtime, handleToEntity);
    expect(events).toHaveLength(1);
  });

  it('swaps ball/brick ids correctly', () => {
    const runtime = {
      contactEvents: [{ colliderA: 2, colliderB: 1 }], // brick first
    };
    const events = parseRuntimeEvents(runtime, handleToEntity);
    expect(events).toHaveLength(1);
    expect(events[0].ballId).toBe('ball1');
    expect(events[0].brickId).toBe('brick1');
  });

  it('ignores non-ball-brick contacts', () => {
    handleToEntity.set(3, { type: 'ball', id: 'ball2' });
    const runtime = {
      contactEvents: [{ colliderA: 1, colliderB: 3 }], // ball-ball
    };
    const events = parseRuntimeEvents(runtime, handleToEntity);
    expect(events).toHaveLength(0);
  });
});
