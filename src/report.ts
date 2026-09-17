import type { FileResult } from "./compress.ts";

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** 削減率。増えたときは符号を付けて + で示す */
export function formatChange(inputBytes: number, outputBytes: number): string {
	const percent = (1 - outputBytes / inputBytes) * 100;
	return percent >= 0 ? `-${percent.toFixed(1)}%` : `+${(-percent).toFixed(1)}%`;
}

export function formatResult(result: FileResult): string {
	switch (result.kind) {
		case "compressed": {
			return `${result.source} → ${result.target}  ${formatBytes(result.inputBytes)} → ${formatBytes(result.outputBytes)} (${formatChange(result.inputBytes, result.outputBytes)})`;
		}
		case "copied": {
			const why = result.reason === "larger" ? "圧縮すると大きくなる" : "圧縮できないフォーマット";
			return `${result.source} → ${result.target}  ${formatBytes(result.bytes)} コピー (${why})`;
		}
		case "failed":
			return `${result.source}  失敗: ${result.message}`;
	}
}

export function formatSummary(results: readonly FileResult[], skipped: number): string {
	const compressed = results.filter((r) => r.kind === "compressed");
	const copied = results.filter((r) => r.kind === "copied");
	const failed = results.filter((r) => r.kind === "failed");
	const inputBytes = compressed.reduce((sum, r) => sum + r.inputBytes, 0);
	const outputBytes = compressed.reduce((sum, r) => sum + r.outputBytes, 0);
	const lines = [
		`圧縮 ${compressed.length} 件: ${formatBytes(inputBytes)} → ${formatBytes(outputBytes)}` +
			(inputBytes > 0 ? ` (${formatChange(inputBytes, outputBytes)})` : ""),
		`コピー ${copied.length} 件`,
		`失敗 ${failed.length} 件`,
		`対象外 ${skipped} 件`,
	];
	if (failed.length > 0) {
		lines.push("", "失敗したファイル:", ...failed.map((r) => `  ${formatResult(r)}`));
	}
	return lines.join("\n");
}
