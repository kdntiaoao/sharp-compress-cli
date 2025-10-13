import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { compressImage } from "./compress";

export async function main(): Promise<void> {
	let positionals: string[];
	let values: Record<string, string | boolean | undefined>;
	try {
		const parsed = parseArgs({
			options: {
				quality: { type: "string" },
				maxWidth: { type: "string" },
				maxHeight: { type: "string" },
				format: { type: "string" },
				outDir: { type: "string" },
			},
			allowPositionals: true,
		});
		positionals = parsed.positionals;
		values = parsed.values;
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
		return;
	}

	const [inputPath] = positionals;
	if (!inputPath) {
		console.error(
			"Usage: pnpm compress -- <inputPath> [--quality 80] [--maxWidth 1280] [--maxHeight 720] [--format webp] [--outDir dist]",
		);
		process.exitCode = 1;
		return;
	}

	try {
		const output = await compressImage(inputPath, {
			quality: parseOptionalNumber(values.quality, "quality"),
			maxWidth: parseOptionalNumber(values.maxWidth, "maxWidth"),
			maxHeight: parseOptionalNumber(values.maxHeight, "maxHeight"),
			format: pickString(values.format),
			outputDir: pickString(values.outDir),
		});
		const relativeOutput = path.relative(process.cwd(), output);
		console.log(`Output written to ${relativeOutput}`);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	}
}

function parseOptionalNumber(
	value: string | boolean | undefined,
	label: string,
): number | undefined {
	const text = pickString(value);
	if (text === undefined) {
		return undefined;
	}
	const parsed = Number(text);
	if (!Number.isFinite(parsed)) {
		throw new Error(`Option "${label}" must be a finite number.`);
	}
	return parsed;
}

function pickString(value: string | boolean | undefined): string | undefined {
	return typeof value === "string" ? value : undefined;
}

const entryFile = process.argv[1];
if (entryFile) {
	const invokedFromCli = pathToFileURL(entryFile).href === import.meta.url;
	if (invokedFromCli) {
		void main();
	}
}
