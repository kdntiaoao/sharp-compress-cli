/** 同時実行数を抑えつつ全件を処理し、入力と同じ順で結果を返す */
export async function mapWithConcurrency<T, R>(
	items: readonly T[],
	limit: number,
	task: (item: T) => Promise<R>,
	onResult?: (result: R) => void,
): Promise<R[]> {
	const results: R[] = Array.from({ length: items.length });
	let next = 0;
	async function worker(): Promise<void> {
		while (next < items.length) {
			const index = next;
			next += 1;
			// ワーカーごとに 1 件ずつ順に処理するのが目的なので、ここは並列にしない
			// oxlint-disable-next-line no-await-in-loop
			const result = await task(items[index] as T);
			results[index] = result;
			onResult?.(result);
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
	return results;
}
