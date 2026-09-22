import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findTargetCollisions, planFile } from "./plan.ts";

describe("planFile", () => {
	it("既定はフォーマットを変えず拡張子だけ正規化する", () => {
		assert.deepEqual(planFile("a/photo.JPEG", {}), {
			kind: "compress",
			source: "a/photo.JPEG",
			target: "a/photo.jpg",
			format: "jpeg",
		});
	});
	it("--format があればトランスコードする", () => {
		assert.deepEqual(planFile("photo.png", { format: "webp" }), {
			kind: "compress",
			source: "photo.png",
			target: "photo.webp",
			format: "webp",
		});
	});
	it("NFD のファイル名は出力側で NFC に揃える", () => {
		const nfd = "カテゴリ.jpg".normalize("NFD");
		const nfc = "カテゴリ.jpg".normalize("NFC");
		assert.notEqual(nfd, nfc);
		assert.equal(planFile(nfd, {}).target, nfc);
		assert.equal(planFile(nfd, {}).source, nfd);
		assert.equal(planFile(`${nfd}.svg`, {}).target, `${nfc}.svg`);
	});
	it("gif / tif / svg は --format が無ければコピー", () => {
		assert.deepEqual(planFile("logo.svg", {}), {
			kind: "copy",
			source: "logo.svg",
			target: "logo.svg",
		});
		assert.equal(planFile("logo.svg", { format: "png" }).kind, "compress");
	});
});

describe("findTargetCollisions", () => {
	it("同じ出力パスになる入力を集める", () => {
		const plans = [
			planFile("a.jpg", {}),
			planFile("a.jpeg", {}),
			planFile("b.png", {}),
			planFile("sub/a.jpg", {}),
		];
		assert.deepEqual([...findTargetCollisions(plans)], [["a.jpg", ["a.jpg", "a.jpeg"]]]);
	});
	it("衝突が無ければ空", () => {
		assert.equal(findTargetCollisions([planFile("a.png", {}), planFile("b.png", {})]).size, 0);
	});
});
