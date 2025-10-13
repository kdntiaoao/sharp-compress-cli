import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { compressImage } from "./compress";

async function main(): Promise<void> {
	const { positionals, values } = parseArgs({
		options: {
			quality: { type: "string" },
			maxWidth: { type: "string" },
			maxHeight: { type: "string" },
			format: { type: "string" },
			outDir: { type: "string" },
		},
		allowPositionals: true,
	});

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

void main();
