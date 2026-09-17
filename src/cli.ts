import { access } from "node:fs/promises";
import path from "node:path";

import { ArgsError, HELP, parseCliArgs } from "./args.ts";
import { executePlan } from "./compress.ts";
import { mapWithConcurrency } from "./concurrency.ts";
import { OutputDirNotEmptyError, prepareOutputDir } from "./output-dir.ts";
import { findTargetCollisions, planFile } from "./plan.ts";
import { formatResult, formatSummary } from "./report.ts";
import { walkImages } from "./walk.ts";

const CONCURRENCY = 4;

export async function main(argv: readonly string[]): Promise<number> {
	const parsed = parseCliArgs(argv);
	if (parsed.kind === "help") {
		process.stdout.write(HELP);
		return 0;
	}
	const inputDir = path.resolve("input");
	const outputDir = path.resolve("out");
	await access(inputDir).catch(() => {
		throw new UsageError(`${inputDir} が無い。画像を置いた input/ をリポジトリ直下に用意する`);
	});

	const { images, skipped } = await walkImages(inputDir);
	if (images.length === 0) {
		throw new UsageError(`${inputDir} に画像が無い`);
	}

	const plans = images.map((image) => planFile(image, parsed.options));
	const collisions = findTargetCollisions(plans);
	if (collisions.size > 0) {
		const lines = [...collisions].map(([target, sources]) => `  ${target} ← ${sources.join(", ")}`);
		throw new UsageError(
			`出力先が同じになるファイルがある。名前を変えるか片方を退避する:\n${lines.join("\n")}`,
		);
	}

	const prepared = await prepareOutputDir(outputDir, {
		input: process.stdin,
		output: process.stderr,
		interactive: process.stdin.isTTY === true,
	});
	if (prepared === "declined") {
		process.stderr.write("中止した\n");
		return 0;
	}

	const results = await mapWithConcurrency(
		plans,
		CONCURRENCY,
		(plan) => executePlan(plan, parsed.options, { inputDir, outputDir }),
		(result) => process.stdout.write(`${formatResult(result)}\n`),
	);
	process.stdout.write(`\n${formatSummary(results, skipped)}\n`);
	return results.some((result) => result.kind === "failed") ? 1 : 0;
}

class UsageError extends Error {}

if (import.meta.main) {
	try {
		process.exitCode = await main(process.argv.slice(2));
	} catch (error) {
		if (error instanceof ArgsError) {
			process.stderr.write(`${error.message}\n\n${HELP}`);
		} else if (error instanceof UsageError || error instanceof OutputDirNotEmptyError) {
			process.stderr.write(`${error.message}\n`);
		} else {
			throw error;
		}
		process.exitCode = 1;
	}
}
