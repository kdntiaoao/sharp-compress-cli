import { parseArgs } from "node:util";

import { OUTPUT_FORMATS, parseOutputFormat } from "./format.ts";
import type { CompressOptions } from "./plan.ts";

export const HELP = `使い方: pnpm compress [オプション]

input/ の画像を圧縮し、同じディレクトリ構造で out/ に書き出す。
書き出せた画像は input/ から消す。

オプション:
  --quality <1-100>     エンコード品質。省略時はフォーマットごとの既定値
  --max-width <px>      この幅に収まるよう縮小する(拡大はしない)
  --max-height <px>     この高さに収まるよう縮小する(拡大はしない)
  --format <形式>       ${OUTPUT_FORMATS.join(" / ")} のいずれかに変換する
  --help                この説明を表示する
`;

export type ParsedArgs = { kind: "help" } | { kind: "run"; options: CompressOptions };

export class ArgsError extends Error {}

const OPTIONS = {
	quality: { type: "string" },
	"max-width": { type: "string" },
	"max-height": { type: "string" },
	format: { type: "string" },
	help: { type: "boolean", short: "h" },
} as const;

function parseRaw(argv: readonly string[]) {
	try {
		return parseArgs({ args: [...argv], allowPositionals: false, options: OPTIONS }).values;
	} catch (error) {
		throw new ArgsError(error instanceof Error ? error.message : String(error));
	}
}

export function parseCliArgs(argv: readonly string[]): ParsedArgs {
	const values = parseRaw(argv);
	if (values.help) return { kind: "help" };

	const options: CompressOptions = {};
	const quality = integerOption(values.quality, "--quality", 1, 100);
	if (quality !== undefined) options.quality = quality;
	const maxWidth = integerOption(values["max-width"], "--max-width", 1);
	if (maxWidth !== undefined) options.maxWidth = maxWidth;
	const maxHeight = integerOption(values["max-height"], "--max-height", 1);
	if (maxHeight !== undefined) options.maxHeight = maxHeight;
	if (typeof values.format === "string") {
		const format = parseOutputFormat(values.format);
		if (format === undefined) {
			throw new ArgsError(`--format は ${OUTPUT_FORMATS.join(" / ")} のいずれか: ${values.format}`);
		}
		options.format = format;
	}
	return { kind: "run", options };
}

function integerOption(
	raw: string | undefined,
	name: string,
	min: number,
	max = Number.POSITIVE_INFINITY,
): number | undefined {
	if (raw === undefined) return undefined;
	const value = Number(raw);
	if (!/^\d+$/.test(raw) || value < min || value > max) {
		const range = max === Number.POSITIVE_INFINITY ? `${min} 以上の整数` : `${min}-${max} の整数`;
		throw new ArgsError(`${name} は ${range}: ${raw}`);
	}
	return value;
}
