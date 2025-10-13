import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const compressImageMock =
	vi.fn<
		(inputPath: string, options: Record<string, unknown>) => Promise<string>
	>();

vi.mock("./compress", () => ({
	compressImage: compressImageMock,
}));

const originalArgv = [...process.argv];
let originalExitCode: number | undefined;
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

// Import after mocks so the CLI uses the stubbed compressImage
const { main } = await import("./cli");

describe("CLI", () => {
	beforeEach(() => {
		compressImageMock.mockReset();
		originalExitCode =
			typeof process.exitCode === "number" ? process.exitCode : undefined;
		process.exitCode = undefined;
		logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		process.argv = [...originalArgv];
		process.exitCode = originalExitCode;
		logSpy.mockRestore();
		errorSpy.mockRestore();
	});

	test("passes normalized options to compressImage", async () => {
		const resolvedOutput = path.join(process.cwd(), "custom", "picture.jpg");
		compressImageMock.mockResolvedValue(resolvedOutput);
		process.argv = [
			"node",
			"cli",
			"./input.png",
			"--quality",
			"85",
			"--maxWidth",
			"1024",
			"--maxHeight",
			"768",
			"--format",
			"webp",
			"--outDir",
			"custom",
		];

		await main();

		expect(compressImageMock).toHaveBeenCalledWith("./input.png", {
			quality: 85,
			maxWidth: 1024,
			maxHeight: 768,
			format: "webp",
			outputDir: "custom",
		});
		expect(logSpy).toHaveBeenCalledWith(
			`Output written to ${path.join("custom", "picture.jpg")}`,
		);
		expect(process.exitCode).toBeUndefined();
	});

	test("prints usage when input path missing", async () => {
		process.argv = ["node", "cli"];

		await main();

		expect(compressImageMock).not.toHaveBeenCalled();
		expect(errorSpy).toHaveBeenCalledWith(
			"Usage: pnpm compress -- <inputPath> [--quality 80] [--maxWidth 1280] [--maxHeight 720] [--format webp] [--outDir dist]",
		);
		expect(process.exitCode).toBe(1);
	});

	test("uses defaults when optional flags are omitted", async () => {
		const resolvedOutput = path.join(process.cwd(), "out", "input.jpg");
		compressImageMock.mockResolvedValue(resolvedOutput);
		process.argv = ["node", "cli", "./input.png"];

		await main();

		expect(compressImageMock).toHaveBeenCalledWith("./input.png", {
			quality: undefined,
			maxWidth: undefined,
			maxHeight: undefined,
			format: undefined,
			outputDir: undefined,
		});
		expect(logSpy).toHaveBeenCalledWith(
			`Output written to ${path.join("out", "input.jpg")}`,
		);
		expect(process.exitCode).toBeUndefined();
	});

	test("reports invalid numeric options", async () => {
		process.argv = ["node", "cli", "./input.png", "--quality", "not-a-number"];

		await main();

		expect(compressImageMock).not.toHaveBeenCalled();
		expect(errorSpy).toHaveBeenCalledWith(
			'Option "quality" must be a finite number.',
		);
		expect(logSpy).not.toHaveBeenCalled();
		expect(process.exitCode).toBe(1);
	});

	test("reports unknown flags", async () => {
		process.argv = ["node", "cli", "--unknown"]; // unrecognized flag

		await main();

		expect(compressImageMock).not.toHaveBeenCalled();
		expect(errorSpy).toHaveBeenCalled();
		const message = errorSpy.mock.calls[0]?.[0];
		expect(String(message)).toContain("Unknown option '--unknown'");
		expect(logSpy).not.toHaveBeenCalled();
		expect(process.exitCode).toBe(1);
	});
});
