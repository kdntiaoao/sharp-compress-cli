import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ArgsError, parseCliArgs } from "./args.ts";

describe("parseCliArgs", () => {
	it("引数なしは空のオプション", () => {
		assert.deepEqual(parseCliArgs([]), { kind: "run", options: {} });
	});
	it("全オプションを数値とフォーマットに変換する", () => {
		assert.deepEqual(
			parseCliArgs([
				"--quality",
				"70",
				"--max-width",
				"1600",
				"--max-height",
				"900",
				"--format",
				"jpg",
			]),
			{ kind: "run", options: { quality: 70, maxWidth: 1600, maxHeight: 900, format: "jpeg" } },
		);
	});
	it("--help は他のオプションより優先する", () => {
		assert.deepEqual(parseCliArgs(["--quality", "abc", "--help"]), { kind: "help" });
	});
	it("quality の範囲外はエラー", () => {
		assert.throws(() => parseCliArgs(["--quality", "0"]), ArgsError);
		assert.throws(() => parseCliArgs(["--quality", "101"]), ArgsError);
		assert.throws(() => parseCliArgs(["--quality", "8.5"]), ArgsError);
	});
	it("未知のフォーマットと位置引数はエラー", () => {
		assert.throws(() => parseCliArgs(["--format", "gif"]), ArgsError);
		assert.throws(() => parseCliArgs(["photo.jpg"]), ArgsError);
		assert.throws(() => parseCliArgs(["--out-dir", "x"]), ArgsError);
	});
});
