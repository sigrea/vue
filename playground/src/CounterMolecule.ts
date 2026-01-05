import { molecule, onMount, onUnmount, readonly, signal, watch } from "@sigrea/core";

export interface CounterProps {
	initialCount: number;
	initialStep: number;
}

export const CounterMolecule = molecule((props: CounterProps) => {
	const count = signal(props.initialCount);
	const step = signal(props.initialStep);

	function setCount(next: number) {
		count.value = next;
	}

	function setStep(next: number) {
		step.value = next;
	}

	function increment() {
		count.value += step.value;
	}

	function decrement() {
		count.value -= step.value;
	}

	function reset() {
		count.value = props.initialCount;
	}

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
	);

	return {
		count: readonly(count),
		step: readonly(step),
		setCount,
		setStep,
		increment,
		decrement,
		reset,
	};
});
