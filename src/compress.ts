import { access, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export type OutputFormat = keyof sharp.FormatEnum;

export interface CompressOptions {
	quality?: number;
	maxWidth?: number;
	maxHeight?: number;
	format?: string;
	outputDir?: string;
}

const DEFAULT_OUTPUT_DIR = "out";
const QUALITY_MIN = 1;
const QUALITY_MAX = 100;

export async function compressImage(
	inputPath: string,
	options: CompressOptions = {},
): Promise<string> {
	await ensureReadableFile(inputPath);

	const {
		quality,
		maxWidth,
		maxHeight,
		format: requestedFormat,
		outputDir = DEFAULT_OUTPUT_DIR,
	} = options;

	const normalizedFormat =
		normalizeFormat(requestedFormat) ??
		inferFormatFromPath(inputPath) ??
		"jpeg";
	const normalizedQuality =
		typeof quality === "number"
			? clamp(Math.round(quality), QUALITY_MIN, QUALITY_MAX)
			: undefined;

	const resolvedOutputDir = path.resolve(process.cwd(), outputDir);
	await mkdir(resolvedOutputDir, { recursive: true });

	const outputFile = buildOutputFilePath(
		resolvedOutputDir,
		inputPath,
		normalizedFormat,
	);

	let transformer = sharp(inputPath);

	if (shouldResize(maxWidth, maxHeight)) {
		transformer = transformer.resize({
			width: sanitizeDimension(maxWidth),
			height: sanitizeDimension(maxHeight),
			fit: "inside",
			withoutEnlargement: true,
		});
	}

	transformer = applyFormat(transformer, normalizedFormat, normalizedQuality);

	await transformer.toFile(outputFile);
	return outputFile;
}

async function ensureReadableFile(filePath: string): Promise<void> {
	try {
		const fileStat = await stat(filePath);
		if (!fileStat.isFile()) {
			throw new Error(
				`Expected a file but received a different path: ${filePath}`,
			);
		}
		await access(filePath);
	} catch {
		throw new Error(`Input file is not accessible: ${filePath}`);
	}
}

function sanitizeDimension(value?: number): number | undefined {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return undefined;
	}
	const rounded = Math.round(value);
	return rounded > 0 ? rounded : undefined;
}

function shouldResize(maxWidth?: number, maxHeight?: number): boolean {
	return Boolean(sanitizeDimension(maxWidth) || sanitizeDimension(maxHeight));
}

function applyFormat(
	instance: sharp.Sharp,
	format: OutputFormat,
	quality?: number,
): sharp.Sharp {
	switch (format) {
		case "jpeg":
			return instance.jpeg({
				quality,
				mozjpeg: true,
			});
		case "webp":
			return instance.webp({ quality });
		case "avif":
			return instance.avif({ quality });
		case "heif":
			return instance.heif({ quality });
		case "tiff":
			return instance.tiff({ quality });
		case "png":
			return instance.png({
				quality,
			});
		default:
			return instance.toFormat(format);
	}
}

function buildOutputFilePath(
	outputDir: string,
	inputPath: string,
	format: OutputFormat,
): string {
	const parsed = path.parse(inputPath);
	const extension = format === "jpeg" ? "jpg" : format;
	return path.join(outputDir, `${parsed.name}.${extension}`);
}

function inferFormatFromPath(filePath: string): OutputFormat | undefined {
	const ext = path.extname(filePath).slice(1);
	if (!ext) {
		return undefined;
	}
	return normalizeFormat(ext);
}

function normalizeFormat(format?: string): OutputFormat | undefined {
	if (!format) {
		return undefined;
	}
	const lower = format.toLowerCase();
	const aliasMap: Record<string, OutputFormat> = {
		jpg: "jpeg",
		jfif: "jpeg",
		tif: "tiff",
	};
	const candidate = (aliasMap[lower] ?? lower) as string;
	return isSupportedFormat(candidate) ? (candidate as OutputFormat) : undefined;
}

function isSupportedFormat(format: string): boolean {
	const entry = sharp.format[format as keyof sharp.FormatEnum] ?? null;
	if (!entry) {
		return false;
	}
	const { output } = entry;
	if (!output) {
		return false;
	}
	return Boolean(output.file || output.buffer || output.stream);
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
