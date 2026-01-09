import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import {
	disposeTrackedMolecules,
	molecule,
	onMount,
	signal,
	watch,
} from "@sigrea/core";

import { useMolecule } from "../useMolecule";
import { flushEffects } from "./testUtils";

describe("useMolecule mount lifecycle", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("calls onMount after component mounts", async () => {
		const onMountCallback = vi.fn();
		const testMolecule = molecule(() => {
			onMount(() => {
				onMountCallback();
			});
			return {};
		});

		expect(onMountCallback).not.toHaveBeenCalled();

		const wrapper = mount(
			defineComponent(() => {
				useMolecule(testMolecule);
				return () => null;
			}),
		);

		await flushEffects();

		expect(onMountCallback).toHaveBeenCalledTimes(1);

		await wrapper.unmount();
	});

	it("defers watch execution until after mount", async () => {
		const watchCallback = vi.fn();
		const setupCallback = vi.fn();

		const testMolecule = molecule(() => {
			const count = signal(0);

			setupCallback();

			watch(count, (value) => {
				watchCallback(value);
			});

			return { count };
		});

		const wrapper = mount(
			defineComponent(() => {
				useMolecule(testMolecule);
				return () => null;
			}),
		);

		expect(setupCallback).toHaveBeenCalledTimes(1);
		expect(watchCallback).not.toHaveBeenCalled();

		await flushEffects();

		expect(watchCallback).not.toHaveBeenCalled();

		await wrapper.unmount();
	});

	it("executes watch callback when signal changes after mount", async () => {
		const watchCallback = vi.fn();

		const testMolecule = molecule(() => {
			const count = signal(0);

			watch(count, (value) => {
				watchCallback(value);
			});

			return { count };
		});

		let instance: { count: { value: number } } | undefined;

		const wrapper = mount(
			defineComponent(() => {
				instance = useMolecule(testMolecule);
				return () => null;
			}),
		);

		await flushEffects();

		expect(watchCallback).not.toHaveBeenCalled();

		if (instance === undefined) {
			throw new Error("Failed to capture instance");
		}

		instance.count.value = 42;
		await flushEffects();

		expect(watchCallback).toHaveBeenCalledTimes(1);
		expect(watchCallback).toHaveBeenCalledWith(42);

		await wrapper.unmount();
	});
});
