<script setup lang="ts">
import { useMolecule, useSignal } from "@sigrea/vue";
import { CounterMolecule, type CounterProps } from "./CounterMolecule";

const props = defineProps<CounterProps>();

const counter = useMolecule(CounterMolecule, props);
const count = useSignal(counter.count);
const step = useSignal(counter.step);
</script>

<template>
	<section class="counter">
		<p class="counter__value">
			<span class="counter__value-label">Count</span>
			<span class="counter__value-number">{{ count }}</span>
		</p>
		<p class="counter__value">
			<span class="counter__value-label">Step</span>
			<span class="counter__value-number">{{ step }}</span>
		</p>
		<div class="counter__controls">
			<button type="button" class="counter__button" @click="counter.decrement">
				Decrement
			</button>
			<button type="button" class="counter__button" @click="counter.reset">
				Reset
			</button>
			<button type="button" class="counter__button" @click="counter.increment">
				Increment
			</button>
		</div>
		<label class="counter__input">
			<span>Manual update</span>
			<input
				type="number"
				:value="count"
				@input="
					counter.setCount(
						Number.parseInt(($event.target as HTMLInputElement).value, 10) || 0,
					)
				"
			/>
		</label>
		<label class="counter__input">
			<span>Live step</span>
			<input
				type="number"
				min="1"
				:value="step"
				@input="
					counter.setStep(
						Number.parseInt(($event.target as HTMLInputElement).value, 10) || 1,
					)
				"
			/>
		</label>
	</section>
</template>
