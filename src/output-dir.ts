import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";

export type Console = {
	input: NodeJS.ReadableStream;
	output: NodeJS.WritableStream;
	/** 標準入力が端末か。端末でなければ確認できないので中身のある out/ は扱えない */
	interactive: boolean;
};

export class OutputDirNotEmptyError extends Error {}

/** out/ を空にして良いか確認し、空にする。.gitignore は残す */
export async function prepareOutputDir(
	outputDir: string,
	console: Console,
): Promise<"ready" | "declined"> {
	const leftovers = (await readdir(outputDir)).filter((name) => name !== ".gitignore");
	if (leftovers.length === 0) return "ready";
	if (!console.interactive) {
		throw new OutputDirNotEmptyError(
			`${outputDir} に前回の結果が ${leftovers.length} 件ある。端末から実行して削除を確認するか、手で空にする`,
		);
	}
	const rl = readline.createInterface({ input: console.input, output: console.output });
	try {
		const answer = await rl.question(
			`${outputDir} に前回の結果が ${leftovers.length} 件ある。すべて削除して続けるか? [y/N] `,
		);
		if (!/^y(es)?$/i.test(answer.trim())) return "declined";
	} finally {
		rl.close();
	}
	await Promise.all(
		leftovers.map((name) => rm(path.join(outputDir, name), { recursive: true, force: true })),
	);
	return "ready";
}
