import { describe, it, expect, beforeEach } from "vitest";
import { calculateNextReview, SRSCard, ReviewQuality } from "./srs";

describe("Spaced Repetition System (SRS)", () => {
  describe("calculateNextReview", () => {
    let baseCard: SRSCard;

    beforeEach(() => {
      baseCard = {
        id: "1",
        front: "Front",
        back: "Back",
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        nextReviewDate: new Date(),
      };
    });

    describe("Incorrect answers (quality < 3)", () => {
      it("should reset interval to 1 and repetitions to 0 for quality 0", () => {
        baseCard.interval = 10;
        baseCard.repetitions = 5;

        const result = calculateNextReview(baseCard, 0);

        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
        expect(result.easeFactor).toBe(2.3); // 2.5 - 0.2
      });

      it("should reset interval to 1 and repetitions to 0 for quality 1", () => {
        baseCard.interval = 5;
        baseCard.repetitions = 2;

        const result = calculateNextReview(baseCard, 1);

        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
        expect(result.easeFactor).toBe(2.3);
      });

      it("should reset interval to 1 and repetitions to 0 for quality 2", () => {
        baseCard.interval = 15;
        baseCard.repetitions = 7;

        const result = calculateNextReview(baseCard, 2);

        expect(result.interval).toBe(1);
        expect(result.repetitions).toBe(0);
        expect(result.easeFactor).toBe(2.3);
      });

      it("should not decrease easeFactor below 1.3", () => {
        baseCard.easeFactor = 1.4;

        const result = calculateNextReview(baseCard, 1);

        expect(result.easeFactor).toBe(1.3); // Math.max(1.3, 1.4 - 0.2)
      });
    });

    describe("Correct answers (quality >= 3)", () => {
      it("should set interval to 1 for the first repetition", () => {
        baseCard.repetitions = 0;

        const result = calculateNextReview(baseCard, 4);

        expect(result.repetitions).toBe(1);
        expect(result.interval).toBe(1);
      });

      it("should set interval to 3 for the second repetition", () => {
        baseCard.repetitions = 1;
        baseCard.interval = 1;

        const result = calculateNextReview(baseCard, 4);

        expect(result.repetitions).toBe(2);
        expect(result.interval).toBe(3);
      });

      it("should multiply interval by easeFactor for subsequent repetitions", () => {
        baseCard.repetitions = 2;
        baseCard.interval = 3;
        baseCard.easeFactor = 2.5;

        const result = calculateNextReview(baseCard, 4);

        expect(result.repetitions).toBe(3);
        expect(result.interval).toBe(8); // Math.round(3 * 2.5) = 8
      });
    });

    describe("Ease Factor adjustments for correct answers", () => {
      it("should calculate correct easeFactor adjustment for quality 3", () => {
        baseCard.easeFactor = 2.0;
        // Formula: easeFactor + 0.1 - (5 - 3) * (0.08 + (5 - 3) * 0.02)
        // 2.0 + 0.1 - 2 * (0.08 + 0.04) = 2.1 - 2 * 0.12 = 2.1 - 0.24 = 1.86

        const result = calculateNextReview(baseCard, 3);

        expect(result.easeFactor).toBeCloseTo(1.86, 2);
      });

      it("should calculate correct easeFactor adjustment for quality 4", () => {
        baseCard.easeFactor = 2.0;
        // Formula: easeFactor + 0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02)
        // 2.0 + 0.1 - 1 * (0.08 + 0.02) = 2.1 - 0.10 = 2.0

        const result = calculateNextReview(baseCard, 4);

        expect(result.easeFactor).toBeCloseTo(2.0, 2);
      });

      it("should calculate correct easeFactor adjustment for quality 5", () => {
        baseCard.easeFactor = 2.0;
        // Formula: easeFactor + 0.1 - (5 - 5) * (0.08 + (5 - 5) * 0.02)
        // 2.0 + 0.1 - 0 = 2.1

        const result = calculateNextReview(baseCard, 5);

        expect(result.easeFactor).toBeCloseTo(2.1, 2);
      });

      it("should not increase easeFactor above 2.5", () => {
        baseCard.easeFactor = 2.5;

        const result = calculateNextReview(baseCard, 5);

        expect(result.easeFactor).toBe(2.5); // Math.min(2.5, 2.5 + 0.1)
      });
    });

    describe("Next Review Date calculation", () => {
      it("should correctly set nextReviewDate based on the calculated interval", () => {
        // Let's do a non-mocked approximate check to avoid vitest timer issues
        const beforeCalc = new Date().getTime();

        baseCard.repetitions = 1;
        baseCard.interval = 1;

        const result = calculateNextReview(baseCard, 4);

        const afterCalc = new Date().getTime();

        expect(result.interval).toBe(3); // second rep -> interval 3

        const expectedDateBefore = new Date(beforeCalc);
        expectedDateBefore.setDate(expectedDateBefore.getDate() + 3);

        const expectedDateAfter = new Date(afterCalc);
        expectedDateAfter.setDate(expectedDateAfter.getDate() + 3);

        expect(result.nextReviewDate.getTime()).toBeGreaterThanOrEqual(expectedDateBefore.getTime());
        expect(result.nextReviewDate.getTime()).toBeLessThanOrEqual(expectedDateAfter.getTime());

        expect(result.lastReviewDate?.getTime()).toBeGreaterThanOrEqual(beforeCalc);
        expect(result.lastReviewDate?.getTime()).toBeLessThanOrEqual(afterCalc);
      });
    });
  });
});
