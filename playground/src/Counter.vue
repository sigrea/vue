<script setup lang="ts">
import { useMolecule, useMutableSignal } from "@sigrea/vue";
import { CounterMolecule, type CounterProps } from "./CounterMolecule";

const props = defineProps<CounterProps>();

const counter = useMolecule(CounterMolecule, props);
const count = useMutableSignal(counter.count);

const increment = () => counter.increment();
const decrement = () => counter.decrement();
const reset = () => counter.reset();
</script>

<template>
	<section class="counter">
		<p class="counter__value">
			<span class="counter__value-label">Count</span>
			<span class="counter__value-number">{{ count }}</span>
		</p>
		<div class="counter__controls">
			<button type="button" class="counter__button" @click="decrement">
				Decrement
			</button>
			<button type="button" class="counter__button" @click="reset">
				Reset
			</button>
			<button type="button" class="counter__button" @click="increment">
				Increment
			</button>
		</div>
		<label class="counter__input">
			<span>Manual update</span>
			<input v-model.number="count" type="number" />
		</label>
	</section>
</template>
