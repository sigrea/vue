import { defineLogic, onMount, onUnmount, signal, watch } from "@sigrea/core";

export interface CounterProps {
	initialCount?: number;
	step?: number;
}

const createCounterLogic = defineLogic<CounterProps>();

export const CounterLogic = createCounterLogic(({ initialCount, step }) => {
	const initial = initialCount ?? 0;
	const incrementStep = step ?? 1;
	const count = signal(initial);

	const increment = () => {
		count.value += incrementStep;
	};

	const decrement = () => {
		count.value -= incrementStep;
	};

	const reset = () => {
		count.value = initial;
	};

	onMount(() => {
		console.log("onMount");
	});

	onUnmount(() => {
		console.log("onUnmount");
	});

	watch(
		() => count.value,
		(value) => {
			console.log(`new count value: ${value}`);
		},
		{ immediate: false },
	);

	return { count, increment, decrement, reset };
});
