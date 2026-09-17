import { readdir } from "node:fs/promises";
import path from "node:path";

import { isImageFile } from "./plan.ts";

export type WalkResult = {
	/** 入力ディレクトリからの相対パス。並び順は固定 */
	images: string[];
	/** 画像ではないので触らなかったファイル数。隠しファイルは数えない */
	skipped: number;
};

export async function walkImages(inputDir: string): Promise<WalkResult> {
	const entries = await readdir(inputDir, { recursive: true, withFileTypes: true });
	const images: string[] = [];
	let skipped = 0;
	for (const entry of entries) {
		if (!entry.isFile() || entry.name.startsWith(".")) continue;
		const relativePath = path.relative(inputDir, path.join(entry.parentPath, entry.name));
		if (isImageFile(relativePath)) {
			images.push(relativePath);
		} else {
			skipped += 1;
		}
	}
	images.sort();
	return { images, skipped };
}
