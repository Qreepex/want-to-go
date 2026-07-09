function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a throttle gate that spaces out calls sharing it to at least
 * `minIntervalMs` apart, running them in submission order.
 */
export function createThrottle(minIntervalMs: number) {
	let chain: Promise<void> = Promise.resolve();
	let lastRunAt = 0;

	return function throttle<T>(task: () => Promise<T>): Promise<T> {
		const gate = chain.then(async () => {
			const wait = lastRunAt + minIntervalMs - Date.now();
			if (wait > 0) {
				await sleep(wait);
			}
			lastRunAt = Date.now();
		});
		chain = gate.catch(() => {});
		return gate.then(task);
	};
}
