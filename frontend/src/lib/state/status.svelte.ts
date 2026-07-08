const autoHideMs = 4000;

class StatusStore {
	message = $state<string | null>(null);

	private hideHandle: ReturnType<typeof setTimeout> | undefined;

	show(message: string, durationMs = autoHideMs): void {
		this.message = message;
		clearTimeout(this.hideHandle);

		if (durationMs > 0) {
			this.hideHandle = setTimeout(() => {
				this.message = null;
			}, durationMs);
		}
	}

	clear(): void {
		clearTimeout(this.hideHandle);
		this.message = null;
	}
}

export const statusStore = new StatusStore();
