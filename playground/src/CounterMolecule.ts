import { molecule, onMount, onUnmount, signal, watch } from "@sigrea/core";

export interface CounterProps {
	initialCount?: number;
	step?: number;
}

export const CounterMolecule = molecule((props: CounterProps) => {
	const { initialCount, step } = props;
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
