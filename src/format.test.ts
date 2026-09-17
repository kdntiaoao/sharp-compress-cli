import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	extensionOf,
	extensionOfFormat,
	formatOfExtension,
	isImageExtension,
	parseOutputFormat,
} from "./format.ts";

describe("parseOutputFormat", () => {
	it("jpg を jpeg として受け付ける", () => {
		assert.equal(parseOutputFormat("jpg"), "jpeg");
		assert.equal(parseOutputFormat("JPEG"), "jpeg");
	});
	it("4 種以外は undefined", () => {
		assert.equal(parseOutputFormat("gif"), undefined);
		assert.equal(parseOutputFormat("tiff"), undefined);
	});
});

describe("extensionOf", () => {
	it("小文字で返す", () => {
		assert.equal(extensionOf("photo.JPG"), "jpg");
		assert.equal(extensionOf("dir.v2/photo.png"), "png");
	});
	it("拡張子が無ければ空", () => {
		assert.equal(extensionOf("README"), "");
		assert.equal(extensionOf(".gitignore"), "");
	});
});

describe("formatOfExtension", () => {
	it("jpg と jpeg は同じ jpeg", () => {
		assert.equal(formatOfExtension("jpg"), "jpeg");
		assert.equal(formatOfExtension("jpeg"), "jpeg");
	});
	it("gif / tif / svg は出力フォーマットを持たない", () => {
		for (const extension of ["gif", "tif", "tiff", "svg"]) {
			assert.equal(formatOfExtension(extension), undefined);
			assert.ok(isImageExtension(extension));
		}
	});
	it("画像以外は対象外", () => {
		assert.equal(isImageExtension("txt"), false);
		assert.equal(isImageExtension(""), false);
	});
});

describe("extensionOfFormat", () => {
	it("jpeg は jpg に正規化する", () => {
		assert.equal(extensionOfFormat("jpeg"), "jpg");
	});
});
