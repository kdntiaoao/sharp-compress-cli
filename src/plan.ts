import path from "node:path";

import {
	type OutputFormat,
	extensionOf,
	extensionOfFormat,
	formatOfExtension,
	isImageExtension,
} from "./format.ts";

export type CompressOptions = {
	quality?: number;
	maxWidth?: number;
	maxHeight?: number;
	format?: OutputFormat;
};

/** 1 ファイルをどう処理するかの決定。パスはすべて input/ または out/ からの相対 */
export type Plan =
	| { kind: "compress"; source: string; target: string; format: OutputFormat }
	| { kind: "copy"; source: string; target: string };

export function isImageFile(relativePath: string): boolean {
	return isImageExtension(extensionOf(relativePath));
}

export function planFile(relativePath: string, options: CompressOptions): Plan {
	const extension = extensionOf(relativePath);
	const format = options.format ?? formatOfExtension(extension);
	if (format === undefined) {
		return { kind: "copy", source: relativePath, target: normalizeTarget(relativePath) };
	}
	const parsed = path.parse(relativePath);
	const target = path.join(parsed.dir, `${parsed.name}.${extensionOfFormat(format)}`);
	return { kind: "compress", source: relativePath, target: normalizeTarget(target), format };
}

// macOS 由来の zip などは濁点が分解された NFD の名前を持ち込むので、出力側で NFC に揃える
function normalizeTarget(relativePath: string): string {
	return relativePath.normalize("NFC");
}

/** 同じ出力パスに複数の入力が対応する組を返す */
export function findTargetCollisions(plans: readonly Plan[]): Map<string, string[]> {
	const sourcesByTarget = new Map<string, string[]>();
	for (const plan of plans) {
		const sources = sourcesByTarget.get(plan.target) ?? [];
		sources.push(plan.source);
		sourcesByTarget.set(plan.target, sources);
	}
	return new Map([...sourcesByTarget].filter(([, sources]) => sources.length > 1));
}
