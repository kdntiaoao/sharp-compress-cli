import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { afterEach, beforeEach, describe, it } from "node:test";

import { OutputDirNotEmptyError, prepareOutputDir } from "./output-dir.ts";

let outputDir: string;

function consoleAnswering(answer: string | undefined) {
	const input = new PassThrough();
	if (answer !== undefined) input.end(`${answer}\n`);
	return { input, output: new PassThrough(), interactive: answer !== undefined };
}

beforeEach(async () => {
	outputDir = await mkdtemp(path.join(os.tmpdir(), "sharp-out-"));
	await writeFile(path.join(outputDir, ".gitignore"), "*\n!.gitignore\n");
});

afterEach(() => rm(outputDir, { recursive: true, force: true }));

describe("prepareOutputDir", () => {
	it(".gitignore だけなら確認せずに進む", async () => {
		assert.equal(await prepareOutputDir(outputDir, consoleAnswering(undefined)), "ready");
	});
	it("y なら .gitignore を残して空にする", async () => {
		await mkdir(path.join(outputDir, "sub"));
		await writeFile(path.join(outputDir, "sub/a.jpg"), "");
		await writeFile(path.join(outputDir, "b.png"), "");
		assert.equal(await prepareOutputDir(outputDir, consoleAnswering("y")), "ready");
		assert.deepEqual(await readdir(outputDir), [".gitignore"]);
	});
	it("y 以外なら何も消さずに declined", async () => {
		await writeFile(path.join(outputDir, "b.png"), "");
		assert.equal(await prepareOutputDir(outputDir, consoleAnswering("")), "declined");
		assert.equal(await prepareOutputDir(outputDir, consoleAnswering("n")), "declined");
		assert.ok((await readdir(outputDir)).includes("b.png"));
	});
	it("端末でなければエラー", async () => {
		await writeFile(path.join(outputDir, "b.png"), "");
		await assert.rejects(
			prepareOutputDir(outputDir, consoleAnswering(undefined)),
			OutputDirNotEmptyError,
		);
	});
});
