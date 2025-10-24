import { nextTick } from "vue";

export async function flushEffects(times = 1): Promise<void> {
	for (let index = 0; index < times; index += 1) {
		await nextTick();
		await Promise.resolve();
	}
}
