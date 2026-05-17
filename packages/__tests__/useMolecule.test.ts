import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";

import {
	type MoleculeInstance,
	computed,
	disposeTrackedMolecules,
	molecule,
	onUnmount,
	signal,
} from "@sigrea/core";

import { useMolecule } from "../useMolecule";
import { flushEffects } from "./testUtils";

describe("useMolecule", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("throws when invoked without an active component instance", () => {
		const counterMolecule = molecule(() => ({}));

		expect(() => useMolecule(counterMolecule)).toThrow(
			"useMolecule can only be used within a Vue component setup().",
		);
	});

	it("mounts molecule and disposes it alongside the component", async () => {
		const cleanups = vi.fn();
		const counterMolecule = molecule((props: { value: number }) => {
			onUnmount(() => cleanups(props.value));
			return { value: props.value };
		});

		const observed: Array<MoleculeInstance<{ value: number }>> = [];

		const wrapper = mount(
			defineComponent(() => {
				const instance = useMolecule(counterMolecule, { value: 1 });
				observed.push(instance);
				return () => null;
			}),
		);

		expect(observed).toHaveLength(1);
		expect(observed[0].value).toBe(1);

		await wrapper.unmount();
		await flushEffects();

		expect(cleanups).toHaveBeenCalledTimes(1);
		expect(cleanups).toHaveBeenCalledWith(1);
	});

	it("passes a snapshot of object props and does not react to prop updates", async () => {
		const counterMolecule = molecule((props: { value: number }) => {
			const count = signal(props.value);

			const reset = () => {
				count.value = props.value;
			};

			return { count, reset };
		});

		let instance:
			| MoleculeInstance<{ count: { value: number }; reset: () => void }>
			| undefined;

		const wrapper = mount(
			defineComponent({
				props: {
					value: { type: Number, required: true },
				},
				setup(props) {
					instance = useMolecule(counterMolecule, props as { value: number });
					return () => null;
				},
			}),
			{
				props: {
					value: 1,
				},
			},
		);

		await flushEffects();

		if (instance === undefined) {
			throw new Error("Failed to capture molecule instance.");
		}

		instance.count.value = 0;
		instance.reset();
		expect(instance.count.value).toBe(1);

		await wrapper.setProps({ value: 2 });
		await flushEffects();

		instance.count.value = 0;
		instance.reset();
		expect(instance.count.value).toBe(1);

		await wrapper.unmount();
	});

	it("tracks a props getter for derived molecule props", async () => {
		const counterMolecule = molecule((props: { value: number }) => {
			const count = signal(props.value);
			const reset = () => {
				count.value = props.value;
			};

			return { count, reset };
		});

		let instance:
			| MoleculeInstance<{ count: { value: number }; reset: () => void }>
			| undefined;

		const wrapper = mount(
			defineComponent({
				props: {
					value: { type: Number, required: true },
				},
				setup(props) {
					instance = useMolecule(counterMolecule, () => ({
						value: props.value * 2,
					}));
					return () => null;
				},
			}),
			{
				props: {
					value: 1,
				},
			},
		);

		await flushEffects();

		if (instance === undefined) {
			throw new Error("Failed to capture molecule instance.");
		}

		instance.count.value = 0;
		instance.reset();
		expect(instance.count.value).toBe(2);

		await wrapper.setProps({ value: 3 });
		await flushEffects();

		instance.count.value = 0;
		instance.reset();
		expect(instance.count.value).toBe(6);

		await wrapper.unmount();
	});

	it("syncs top-level key removal from props getters", async () => {
		const dialogMolecule = molecule(
			(props: { disabled?: boolean; open: boolean }) => {
				return {
					disabled: computed(() => props.disabled),
					hasDisabled: computed(() => "disabled" in props),
				};
			},
		);

		const disabled = ref<boolean | undefined>(true);
		let instance:
			| MoleculeInstance<{
					disabled: { value: boolean | undefined };
					hasDisabled: { value: boolean };
			  }>
			| undefined;

		const wrapper = mount(
			defineComponent(() => {
				instance = useMolecule(dialogMolecule, () =>
					disabled.value === undefined
						? { open: true }
						: { disabled: disabled.value, open: true },
				);
				return () => null;
			}),
		);

		await flushEffects();

		if (instance === undefined) {
			throw new Error("Failed to capture molecule instance.");
		}

		expect(instance.hasDisabled.value).toBe(true);
		expect(instance.disabled.value).toBe(true);

		disabled.value = undefined;
		await flushEffects();

		expect(instance.hasDisabled.value).toBe(false);
		expect(instance.disabled.value).toBeUndefined();

		await wrapper.unmount();
	});

	it("stops props getter sync after scope disposal", async () => {
		const counterMolecule = molecule((props: { value: number }) => {
			const count = signal(props.value);
			const reset = () => {
				count.value = props.value;
			};

			return { count, reset };
		});

		const source = ref(1);
		let instance:
			| MoleculeInstance<{ count: { value: number }; reset: () => void }>
			| undefined;

		const wrapper = mount(
			defineComponent(() => {
				instance = useMolecule(counterMolecule, () => ({
					value: source.value,
				}));
				return () => null;
			}),
		);

		await flushEffects();

		if (instance === undefined) {
			throw new Error("Failed to capture molecule instance.");
		}

		source.value = 2;
		await flushEffects();
		instance.count.value = 0;
		instance.reset();
		expect(instance.count.value).toBe(2);

		await wrapper.unmount();

		source.value = 3;
		await flushEffects();
		instance.count.value = 0;
		instance.reset();
		expect(instance.count.value).toBe(2);
	});
});
