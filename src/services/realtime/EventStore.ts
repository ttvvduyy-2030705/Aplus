import type {RealtimeEvent} from '@/types/realtime';

const MAX_EVENTS = 80;

export class EventStore {
  private events: RealtimeEvent[] = [];
  private dedupeKeys = new Map<string, number>();
  duplicateEvents = 0;
  droppedEvents = 0;

  add(event: RealtimeEvent): RealtimeEvent {
    const lastSeen = this.dedupeKeys.get(event.dedupeKey);
    const isDuplicate = typeof lastSeen === 'number' && event.receivedAt - lastSeen < 2000;
    const normalized: RealtimeEvent = {
      ...event,
      ignoredAsDuplicate: isDuplicate,
      processedAt: isDuplicate ? undefined : Date.now(),
    };

    if (isDuplicate) {
      this.duplicateEvents += 1;
    } else {
      this.dedupeKeys.set(event.dedupeKey, event.receivedAt);
    }

    this.events = [normalized, ...this.events].slice(0, MAX_EVENTS);
    return {...normalized, payload: {...normalized.payload}};
  }

  list(): RealtimeEvent[] {
    return this.events.map(event => ({...event, payload: {...event.payload}}));
  }

  clear() {
    this.events = [];
    this.dedupeKeys.clear();
    this.duplicateEvents = 0;
    this.droppedEvents = 0;
  }
}
