import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setTimeout as sleep } from "node:timers/promises";

import { mapWithConcurrency } from "./concurrency.ts";

describe("mapWithConcurrency", () => {
	it("同時実行数を超えず、結果は入力順", async () => {
		let running = 0;
		let peak = 0;
		const results = await mapWithConcurrency([30, 5, 20, 1, 10], 2, async (ms) => {
			running += 1;
			peak = Math.max(peak, running);
			await sleep(ms);
			running -= 1;
			return ms * 2;
		});
		assert.deepEqual(results, [60, 10, 40, 2, 20]);
		assert.equal(peak, 2);
	});
	it("空でも動く", async () => {
		assert.deepEqual(await mapWithConcurrency([], 4, async (x: number) => x), []);
	});
});
