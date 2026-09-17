import assert from "node:assert/strict";
import { mkdtemp, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import sharp from "sharp";

import { type Directories, executePlan } from "./compress.ts";
import { type CompressOptions, planFile } from "./plan.ts";

let directories: Directories;

async function put(relativePath: string, data: Buffer): Promise<void> {
	const fullPath = path.join(directories.inputDir, relativePath);
	await mkdir(path.dirname(fullPath), { recursive: true });
	await writeFile(fullPath, data);
}

function photo(width: number, height: number) {
	return sharp({
		create: {
			width,
			height,
			channels: 3,
			background: "#888",
			noise: { type: "gaussian", mean: 128, sigma: 40 },
		},
	});
}

async function run(relativePath: string, options: CompressOptions = {}) {
	return executePlan(planFile(relativePath, options), options, directories);
}

before(async () => {
	const root = await mkdtemp(path.join(os.tmpdir(), "sharp-compress-"));
	directories = { inputDir: path.join(root, "input"), outputDir: path.join(root, "out") };
	await mkdir(directories.inputDir);
	await mkdir(directories.outputDir);
});

after(async () => {
	const { rm } = await import("node:fs/promises");
	await rm(path.dirname(directories.inputDir), { recursive: true, force: true });
});

describe("executePlan", () => {
	it("同一フォーマットの再エンコードで小さくなる", async () => {
		await put("photos/a.JPG", await photo(400, 300).jpeg({ quality: 100 }).toBuffer());
		const result = await run("photos/a.JPG", { quality: 60 });
		assert.equal(result.kind, "compressed");
		assert.equal(result.target, "photos/a.jpg");
		if (result.kind !== "compressed") return;
		assert.ok(result.outputBytes < result.inputBytes);
		assert.ok(await stat(path.join(directories.outputDir, "photos/a.jpg")));
	});

	it("最大幅に収まるよう縮小し、拡大はしない", async () => {
		await put("wide.png", await photo(400, 200).png().toBuffer());
		await run("wide.png", { maxWidth: 100 });
		const shrunk = await sharp(path.join(directories.outputDir, "wide.png")).metadata();
		assert.deepEqual([shrunk.width, shrunk.height], [100, 50]);

		await put("small.png", await photo(40, 20).png().toBuffer());
		await run("small.png", { maxWidth: 100 });
		const kept = await sharp(path.join(directories.outputDir, "small.png")).metadata();
		assert.deepEqual([kept.width, kept.height], [40, 20]);
	});

	it("トランスコードすると拡張子が変わる", async () => {
		await put("t.png", await photo(50, 50).png().toBuffer());
		const result = await run("t.png", { format: "webp" });
		assert.equal(result.kind, "compressed");
		const meta = await sharp(path.join(directories.outputDir, "t.webp")).metadata();
		assert.equal(meta.format, "webp");
	});

	it("EXIF の向きを画素に焼き込み、メタデータは残さない", async () => {
		const rotated = await photo(20, 10).jpeg().withMetadata({ orientation: 6 }).toBuffer();
		await put("rotated.jpg", rotated);
		await run("rotated.jpg", { format: "png" });
		const meta = await sharp(path.join(directories.outputDir, "rotated.png")).metadata();
		assert.deepEqual([meta.width, meta.height], [10, 20]);
		assert.equal(meta.orientation, undefined);
		assert.equal(meta.exif, undefined);
	});

	it("元より大きくなるなら元をコピーする", async () => {
		const tiny = await sharp({ create: { width: 64, height: 64, channels: 3, background: "#fff" } })
			.jpeg({ quality: 1 })
			.toBuffer();
		await put("tiny.jpeg", tiny);
		const result = await run("tiny.jpeg", { quality: 100 });
		assert.equal(result.kind, "copied");
		if (result.kind !== "copied") return;
		assert.equal(result.reason, "larger");
		assert.equal(result.target, "tiny.jpg");
		assert.equal((await stat(path.join(directories.outputDir, "tiny.jpg"))).size, tiny.byteLength);
	});

	it("gif は --format が無ければコピー、あればトランスコード", async () => {
		await put("still.gif", await photo(10, 10).gif().toBuffer());
		const copied = await run("still.gif");
		assert.equal(copied.kind, "copied");
		if (copied.kind === "copied") assert.equal(copied.reason, "unsupported");

		const converted = await run("still.gif", { format: "avif" });
		assert.equal(converted.kind, "compressed");
		assert.ok((await readdir(directories.outputDir)).includes("still.avif"));
	});

	it("アニメーション画像は失敗として報告する", async () => {
		const frames = Buffer.concat([Buffer.alloc(4 * 4 * 3, 255), Buffer.alloc(4 * 4 * 3, 0)]);
		const animated = await sharp(frames, {
			raw: { width: 4, height: 8, channels: 3, pageHeight: 4 },
		})
			.gif()
			.toBuffer();
		await put("anim.gif", animated);
		const result = await run("anim.gif", { format: "webp" });
		assert.equal(result.kind, "failed");
		if (result.kind === "failed") assert.match(result.message, /アニメーション/);
	});

	it("壊れたファイルは失敗として報告する", async () => {
		await put("broken.png", Buffer.from("not an image"));
		const result = await run("broken.png");
		assert.equal(result.kind, "failed");
	});
});
