import { unlink } from "node:fs/promises";
import path from "node:path";

import type { FileResult } from "./compress.ts";

/** out/ に結果が書けた入力ファイルを消す。失敗したものは手で調べられるよう残す */
export async function removeProcessedInputs(
	results: readonly FileResult[],
	inputDir: string,
): Promise<number> {
	const processed = results.filter((result) => result.kind !== "failed");
	await Promise.all(processed.map((result) => unlink(path.join(inputDir, result.source))));
	return processed.length;
}
