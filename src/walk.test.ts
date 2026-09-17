import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import { walkImages } from "./walk.ts";

let root: string;

before(async () => {
	root = await mkdtemp(path.join(os.tmpdir(), "sharp-walk-"));
	const files = [
		"b.jpg",
		"sub/deep/a.PNG",
		"sub/logo.svg",
		"notes.txt",
		".gitignore",
		"sub/.DS_Store",
	];
	await Promise.all(
		files.map(async (file) => {
			await mkdir(path.join(root, path.dirname(file)), { recursive: true });
			await writeFile(path.join(root, file), "");
		}),
	);
	await mkdir(path.join(root, "empty"));
});

after(() => rm(root, { recursive: true, force: true }));

describe("walkImages", () => {
	it("画像だけを相対パスで並べ、隠しファイルは数えない", async () => {
		const result = await walkImages(root);
		assert.deepEqual(result, {
			images: ["b.jpg", "sub/deep/a.PNG", "sub/logo.svg"],
			skipped: 1,
		});
	});
});
