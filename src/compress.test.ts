import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import { compressImage } from "./compress";

const SAMPLE_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="#000" /></svg>';

let tempDir: string;

beforeEach(async () => {
	tempDir = await mkdtemp(path.join(os.tmpdir(), "compress-test-"));
});

afterEach(async () => {
	await rm(tempDir, { recursive: true, force: true });
});

test("falls back to jpeg output for svg input", async () => {
	const inputDir = path.join(tempDir, "input");
	const outputDir = path.join(tempDir, "output");
	await mkdir(inputDir, { recursive: true });
	const inputPath = path.join(inputDir, "vector.svg");
	await writeFile(inputPath, SAMPLE_SVG, "utf8");

	const outputPath = await compressImage(inputPath, { outputDir });

	expect(path.extname(outputPath)).toBe(".jpeg");
	const outputStat = await stat(outputPath);
	expect(outputStat.isFile()).toBe(true);
});
