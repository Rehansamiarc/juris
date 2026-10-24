import type { FlashcardRecord } from "./types";

export type Rating = 0 | 1 | 2 | 3; // again, hard, good, easy

export const RATING_LABEL: Record<Rating, string> = {
  0: "Again",
  1: "Hard",
  2: "Good",
  3: "Easy",
};

const DAY = 86_400_000;

/**
 * A compact SM-2 style scheduler. Intervals are deliberately conservative for
 * law students who need durable recall rather than volume.
 */
export function schedule(card: FlashcardRecord, rating: Rating, now = new Date()) {
  let ease = card.ease;
  let interval = card.intervalDays;
  let reps = card.reps;
  let lapses = card.lapses;

  if (rating === 0) {
    ease = Math.max(1.3, ease - 0.2);
    interval = 0;
    lapses += 1;
    reps = 0;
    return {
      ease,
      intervalDays: 0,
      reps,
      lapses,
      dueAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    };
  }

  if (rating === 1) {
    ease = Math.max(1.3, ease - 0.15);
    interval = interval === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
  } else if (rating === 2) {
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.round(interval * ease);
  } else {
    ease = Math.min(3.2, ease + 0.15);
    interval = reps === 0 ? 2 : reps === 1 ? 5 : Math.round(interval * ease * 1.3);
  }

  interval = Math.min(interval, 180);
  reps += 1;
  return {
    ease,
    intervalDays: interval,
    reps,
    lapses,
    dueAt: new Date(now.getTime() + interval * DAY).toISOString(),
  };
}
