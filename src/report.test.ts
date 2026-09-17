import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatBytes, formatChange, formatResult, formatSummary } from "./report.ts";

describe("formatBytes", () => {
	it("単位を切り替える", () => {
		assert.equal(formatBytes(512), "512 B");
		assert.equal(formatBytes(2048), "2.0 KB");
		assert.equal(formatBytes(3 * 1024 * 1024), "3.00 MB");
	});
});

describe("formatChange", () => {
	it("増えたときは + で示す", () => {
		assert.equal(formatChange(1000, 250), "-75.0%");
		assert.equal(formatChange(100, 104), "+4.0%");
		assert.equal(formatChange(100, 100), "-0.0%");
	});
});

describe("formatResult", () => {
	it("削減率を出す", () => {
		assert.equal(
			formatResult({
				kind: "compressed",
				source: "a.jpg",
				target: "a.jpg",
				inputBytes: 1000,
				outputBytes: 250,
			}),
			"a.jpg → a.jpg  1000 B → 250 B (-75.0%)",
		);
	});
	it("コピーは理由を添える", () => {
		assert.match(
			formatResult({
				kind: "copied",
				source: "a.gif",
				target: "a.gif",
				bytes: 10,
				reason: "unsupported",
			}),
			/コピー \(圧縮できないフォーマット\)/,
		);
	});
});

describe("formatSummary", () => {
	it("件数と失敗一覧をまとめる", () => {
		const summary = formatSummary(
			[
				{
					kind: "compressed",
					source: "a.jpg",
					target: "a.jpg",
					inputBytes: 2000,
					outputBytes: 1000,
				},
				{ kind: "failed", source: "x.png", message: "壊れている" },
			],
			3,
		);
		assert.match(summary, /^圧縮 1 件: 2\.0 KB → 1000 B \(-50\.0%\)$/m);
		assert.match(summary, /^失敗 1 件$/m);
		assert.match(summary, /^対象外 3 件$/m);
		assert.match(summary, /x\.png  失敗: 壊れている/);
	});
});
