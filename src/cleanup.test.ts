import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import { removeProcessedInputs } from "./cleanup.ts";
import type { FileResult } from "./compress.ts";

let root: string;

before(async () => {
	root = await mkdtemp(path.join(os.tmpdir(), "sharp-cleanup-"));
	await mkdir(path.join(root, "sub"));
	await Promise.all(
		["a.jpg", "sub/b.svg", "broken.png", "notes.txt"].map((file) =>
			writeFile(path.join(root, file), ""),
		),
	);
});

after(() => rm(root, { recursive: true, force: true }));

describe("removeProcessedInputs", () => {
	it("圧縮とコピーの入力だけ消し、失敗と対象外は残す", async () => {
		const results: FileResult[] = [
			{ kind: "compressed", source: "a.jpg", target: "a.jpg", inputBytes: 10, outputBytes: 5 },
			{ kind: "copied", source: "sub/b.svg", target: "sub/b.svg", bytes: 3, reason: "unsupported" },
			{ kind: "failed", source: "broken.png", message: "壊れている" },
		];
		assert.equal(await removeProcessedInputs(results, root), 2);
		const remaining = await readdir(root, { recursive: true });
		assert.deepEqual(remaining.toSorted(), ["broken.png", "notes.txt", "sub"]);
	});
});
