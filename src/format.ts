export const OUTPUT_FORMATS = ["jpeg", "png", "webp", "avif"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

// 出力フォーマットに直接対応する拡張子
const EXTENSION_TO_FORMAT: Record<string, OutputFormat> = {
	jpg: "jpeg",
	jpeg: "jpeg",
	png: "png",
	webp: "webp",
	avif: "avif",
};

// 読めるが出力フォーマットが無いので、--format 指定時だけトランスコードする拡張子
const COPY_ONLY_EXTENSIONS = new Set(["gif", "tif", "tiff", "svg"]);

const FORMAT_TO_EXTENSION: Record<OutputFormat, string> = {
	jpeg: "jpg",
	png: "png",
	webp: "webp",
	avif: "avif",
};

export function isOutputFormat(value: string): value is OutputFormat {
	return (OUTPUT_FORMATS as readonly string[]).includes(value);
}

/** --format の値を正規化する。`jpg` は `jpeg` として受け付ける */
export function parseOutputFormat(value: string): OutputFormat | undefined {
	const lower = value.toLowerCase();
	if (lower === "jpg") return "jpeg";
	return isOutputFormat(lower) ? lower : undefined;
}

/** ファイル名の拡張子を小文字・ドット無しで返す */
export function extensionOf(fileName: string): string {
	const index = fileName.lastIndexOf(".");
	if (index <= 0) return "";
	return fileName.slice(index + 1).toLowerCase();
}

export function isImageExtension(extension: string): boolean {
	return extension in EXTENSION_TO_FORMAT || COPY_ONLY_EXTENSIONS.has(extension);
}

/** 拡張子から入力画像のフォーマットを返す。出力フォーマットが無いものは undefined */
export function formatOfExtension(extension: string): OutputFormat | undefined {
	return EXTENSION_TO_FORMAT[extension];
}

export function extensionOfFormat(format: OutputFormat): string {
	return FORMAT_TO_EXTENSION[format];
}
