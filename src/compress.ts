import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp, { type Sharp } from "sharp";

import { type OutputFormat, extensionOf, formatOfExtension } from "./format.ts";
import type { CompressOptions, Plan } from "./plan.ts";

export type Directories = { inputDir: string; outputDir: string };

export type FileResult =
	| { kind: "compressed"; source: string; target: string; inputBytes: number; outputBytes: number }
	| { kind: "copied"; source: string; target: string; bytes: number; reason: CopyReason }
	| { kind: "failed"; source: string; message: string };

/** larger: 圧縮すると元より大きくなった / unsupported: 出力フォーマットが無い */
export type CopyReason = "larger" | "unsupported";

export class UnsupportedImageError extends Error {}

export async function executePlan(
	plan: Plan,
	options: CompressOptions,
	directories: Directories,
): Promise<FileResult> {
	try {
		return plan.kind === "copy"
			? await copy(plan, directories, "unsupported")
			: await compress(plan, options, directories);
	} catch (error) {
		return {
			kind: "failed",
			source: plan.source,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}

async function copy(
	plan: Plan,
	{ inputDir, outputDir }: Directories,
	reason: CopyReason,
): Promise<FileResult> {
	const sourcePath = path.join(inputDir, plan.source);
	const targetPath = path.join(outputDir, plan.target);
	await mkdir(path.dirname(targetPath), { recursive: true });
	await copyFile(sourcePath, targetPath);
	const { size } = await stat(sourcePath);
	return { kind: "copied", source: plan.source, target: plan.target, bytes: size, reason };
}

async function compress(
	plan: Extract<Plan, { kind: "compress" }>,
	options: CompressOptions,
	directories: Directories,
): Promise<FileResult> {
	const sourcePath = path.join(directories.inputDir, plan.source);
	const targetPath = path.join(directories.outputDir, plan.target);

	const metadata = await sharp(sourcePath).metadata();
	if ((metadata.pages ?? 1) > 1) {
		throw new UnsupportedImageError("アニメーション画像には対応していない");
	}

	let pipeline = sharp(sourcePath).autoOrient();
	const resizes = options.maxWidth !== undefined || options.maxHeight !== undefined;
	if (resizes) {
		pipeline = pipeline.resize({
			width: options.maxWidth,
			height: options.maxHeight,
			fit: "inside",
			withoutEnlargement: true,
		});
	}
	const output = await encode(pipeline, plan.format, options.quality).toBuffer();

	const { size: inputBytes } = await stat(sourcePath);
	const sameFormat = formatOfExtension(extensionOf(plan.source)) === plan.format;
	if (sameFormat && !resizes && output.byteLength >= inputBytes) {
		return copy(plan, directories, "larger");
	}

	await mkdir(path.dirname(targetPath), { recursive: true });
	await writeFile(targetPath, output);
	return {
		kind: "compressed",
		source: plan.source,
		target: plan.target,
		inputBytes,
		outputBytes: output.byteLength,
	};
}

function encode(pipeline: Sharp, format: OutputFormat, quality: number | undefined) {
	switch (format) {
		case "jpeg":
			return pipeline.jpeg(quality === undefined ? {} : { quality });
		case "webp":
			return pipeline.webp(quality === undefined ? {} : { quality });
		case "avif":
			return pipeline.avif(quality === undefined ? {} : { quality });
		case "png":
			// quality 指定が無いときは可逆のまま圧縮率だけ最大にする
			return pipeline.png(
				quality === undefined ? { compressionLevel: 9 } : { palette: true, quality },
			);
	}
}
