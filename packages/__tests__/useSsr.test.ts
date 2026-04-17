// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import { createSSRApp, h, onServerPrefetch } from "vue";
import { renderToString } from "vue/server-renderer";

import {
	computed as createComputed,
	disposeTrackedMolecules,
	molecule,
	onDispose,
	onMount,
	signal,
	watch,
	watchEffect,
} from "@sigrea/core";

import { useComputed } from "../useComputed";
import { useMolecule } from "../useMolecule";
import { useSignal } from "../useSignal";
import { useSnapshot } from "../useSnapshot";

async function flushMicrotasks(times = 1): Promise<void> {
	for (let index = 0; index < times; index += 1) {
		await Promise.resolve();
	}
}

describe("SSR support", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("disposes molecules after server rendering without running mount jobs", async () => {
		let mounted = 0;
		let disposed = 0;
		let watched = 0;
		let effected = 0;

		const source = signal(1);
		const testMolecule = molecule(() => {
			onMount(() => {
				mounted += 1;
			});
			onDispose(() => {
				disposed += 1;
			});
			watch(source, () => {
				watched += 1;
			});
			watchEffect(() => {
				source.value;
				effected += 1;
			});
			return { source };
		});

		const html = await renderToString(
			createSSRApp({
				setup() {
					const instance = useMolecule(testMolecule);
					return () => h("span", String(instance.source.value));
				},
			}),
		);

		expect(html).toBe("<span>1</span>");
		expect(mounted).toBe(0);
		expect(watched).toBe(0);
		expect(effected).toBe(0);

		await flushMicrotasks(2);

		expect(disposed).toBe(1);

		await flushMicrotasks(2);

		expect(disposed).toBe(1);
	});

	it("keeps molecules alive through onServerPrefetch and disposes once after async server rendering", async () => {
		let mounted = 0;
		let disposed = 0;
		let disposedDuringPrefetch = 0;
		let watched = 0;
		let effected = 0;

		const testMolecule = molecule(() => {
			const source = signal(1);
			onMount(() => {
				mounted += 1;
			});
			onDispose(() => {
				disposed += 1;
			});
			watch(source, () => {
				watched += 1;
			});
			watchEffect(() => {
				source.value;
				effected += 1;
			});
			return { source };
		});

		const html = await renderToString(
			createSSRApp({
				setup() {
					const instance = useMolecule(testMolecule);
					onServerPrefetch(async () => {
						await Promise.resolve();
						disposedDuringPrefetch = disposed;
						instance.source.value = 2;
					});
					return () => h("span", String(instance.source.value));
				},
			}),
		);

		expect(html).toBe("<span>2</span>");
		expect(mounted).toBe(0);
		expect(watched).toBe(0);
		expect(effected).toBe(0);
		expect(disposedDuringPrefetch).toBe(0);

		await flushMicrotasks(2);

		expect(disposed).toBe(1);

		await flushMicrotasks(2);

		expect(disposed).toBe(1);
	});

	it("cleans up useSignal subscriptions after server rendering", async () => {
		const count = signal(1);
		const trackedCount = count as typeof count & { subs?: unknown };

		const html = await renderToString(
			createSSRApp({
				setup() {
					const value = useSignal(count);
					return () => h("span", String(value.value));
				},
			}),
		);

		expect(html).toBe("<span>1</span>");

		await flushMicrotasks(2);

		expect(trackedCount.subs).toBeUndefined();

		count.value = 2;
		await flushMicrotasks(2);

		expect(trackedCount.subs).toBeUndefined();
	});

	it("keeps useSignal subscriptions through onServerPrefetch", async () => {
		const count = signal(1);
		const trackedCount = count as typeof count & { subs?: unknown };
		let subscribedDuringPrefetch = false;

		const html = await renderToString(
			createSSRApp({
				setup() {
					const value = useSignal(count);
					onServerPrefetch(async () => {
						await Promise.resolve();
						subscribedDuringPrefetch = trackedCount.subs !== undefined;
						count.value = 2;
					});
					return () => h("span", String(value.value));
				},
			}),
		);

		expect(html).toBe("<span>2</span>");
		expect(subscribedDuringPrefetch).toBe(true);

		await flushMicrotasks(2);

		expect(trackedCount.subs).toBeUndefined();

		count.value = 3;
		await flushMicrotasks(2);

		expect(trackedCount.subs).toBeUndefined();
	});

	it("cleans up useComputed subscriptions after server rendering", async () => {
		let reads = 0;
		const base = signal(2);
		const doubled = createComputed(() => {
			reads += 1;
			return base.value * 2;
		});
		const trackedComputed = doubled as typeof doubled & { subs?: unknown };

		const html = await renderToString(
			createSSRApp({
				setup() {
					const value = useComputed(doubled);
					return () => h("span", String(value.value));
				},
			}),
		);

		expect(html).toBe("<span>4</span>");
		expect(reads).toBe(1);

		await flushMicrotasks(2);

		expect(trackedComputed.subs).toBeUndefined();

		base.value = 4;
		await flushMicrotasks(2);

		expect(reads).toBe(1);
		expect(trackedComputed.subs).toBeUndefined();
	});

	it("keeps useComputed subscriptions through onServerPrefetch", async () => {
		let reads = 0;
		const base = signal(2);
		const tripled = createComputed(() => {
			reads += 1;
			return base.value * 3;
		});
		const trackedComputed = tripled as typeof tripled & { subs?: unknown };
		let subscribedDuringPrefetch = false;

		const html = await renderToString(
			createSSRApp({
				setup() {
					const value = useComputed(tripled);
					onServerPrefetch(async () => {
						await Promise.resolve();
						subscribedDuringPrefetch = trackedComputed.subs !== undefined;
						base.value = 4;
					});
					return () => h("span", String(value.value));
				},
			}),
		);

		expect(html).toBe("<span>12</span>");
		expect(reads).toBe(2);
		expect(subscribedDuringPrefetch).toBe(true);

		await flushMicrotasks(2);

		expect(trackedComputed.subs).toBeUndefined();

		base.value = 5;
		await flushMicrotasks(2);

		expect(reads).toBe(2);
		expect(trackedComputed.subs).toBeUndefined();
	});

	it("disposes molecules after ssrRender server rendering", async () => {
		let disposed = 0;

		const testMolecule = molecule(() => {
			const count = signal(1);
			onDispose(() => {
				disposed += 1;
			});
			return { count };
		});

		const html = await renderToString(
			createSSRApp({
				setup() {
					const instance = useMolecule(testMolecule);
					return { instance };
				},
				ssrRender(
					_ctx: { instance: { count: { value: number } } },
					_push: (chunk: string) => void,
				) {
					_push(`<span>${_ctx.instance.count.value}</span>`);
				},
			}),
		);

		expect(html).toBe("<span>1</span>");

		await flushMicrotasks(2);

		expect(disposed).toBe(1);
	});

	it("keeps molecules alive through onServerPrefetch in ssrRender components", async () => {
		let disposed = 0;
		let disposedDuringPrefetch = 0;

		const testMolecule = molecule(() => {
			const count = signal(1);
			onDispose(() => {
				disposed += 1;
			});
			return { count };
		});

		const html = await renderToString(
			createSSRApp({
				setup() {
					const instance = useMolecule(testMolecule);
					onServerPrefetch(async () => {
						await Promise.resolve();
						disposedDuringPrefetch = disposed;
						instance.count.value = 2;
					});
					return { instance };
				},
				ssrRender(
					_ctx: { instance: { count: { value: number } } },
					_push: (chunk: string) => void,
				) {
					_push(`<span>${_ctx.instance.count.value}</span>`);
				},
			}),
		);

		expect(html).toBe("<span>2</span>");
		expect(disposedDuringPrefetch).toBe(0);

		await flushMicrotasks(2);

		expect(disposed).toBe(1);
	});

	it("cleans up useSignal subscriptions after ssrRender server rendering", async () => {
		const count = signal(1);
		const trackedCount = count as typeof count & { subs?: unknown };

		const html = await renderToString(
			createSSRApp({
				setup() {
					const value = useSignal(count);
					return { value };
				},
				ssrRender(_ctx: { value: string }, _push: (chunk: string) => void) {
					_push(`<span>${_ctx.value}</span>`);
				},
			}),
		);

		expect(html).toBe("<span>1</span>");

		await flushMicrotasks(2);

		expect(trackedCount.subs).toBeUndefined();

		count.value = 2;
		await flushMicrotasks(2);

		expect(trackedCount.subs).toBeUndefined();
	});

	it("cleans up useComputed subscriptions after ssrRender server rendering", async () => {
		let reads = 0;
		const base = signal(2);
		const tripled = createComputed(() => {
			reads += 1;
			return base.value * 3;
		});

		const html = await renderToString(
			createSSRApp({
				setup() {
					const value = useComputed(tripled);
					return { value };
				},
				ssrRender(_ctx: { value: string }, _push: (chunk: string) => void) {
					_push(`<span>${_ctx.value}</span>`);
				},
			}),
		);

		expect(html).toBe("<span>6</span>");
		expect(reads).toBe(1);

		base.value = 4;
		await flushMicrotasks(2);

		expect(reads).toBe(1);
	});

	it("flushes multiple registered SSR cleanups once per ssrRender component", async () => {
		const firstUnsubscribe = vi.fn();
		const secondUnsubscribe = vi.fn();

		const firstHandler = {
			getSnapshot: () => ({ value: "first", version: 0 }),
			subscribe: () => firstUnsubscribe,
		};
		const secondHandler = {
			getSnapshot: () => ({ value: "second", version: 0 }),
			subscribe: () => secondUnsubscribe,
		};

		const html = await renderToString(
			createSSRApp({
				setup() {
					const first = useSnapshot(firstHandler);
					const second = useSnapshot(secondHandler);
					return { first, second };
				},
				ssrRender(
					_ctx: { first: string; second: string },
					_push: (chunk: string) => void,
				) {
					_push(`<span>${_ctx.first}:${_ctx.second}</span>`);
				},
			}),
		);

		expect(html).toBe("<span>first:second</span>");

		await flushMicrotasks(2);

		expect(firstUnsubscribe).toHaveBeenCalledTimes(1);
		expect(secondUnsubscribe).toHaveBeenCalledTimes(1);

		await flushMicrotasks(2);

		expect(firstUnsubscribe).toHaveBeenCalledTimes(1);
		expect(secondUnsubscribe).toHaveBeenCalledTimes(1);
	});
});
