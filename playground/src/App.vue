<script setup lang="ts">
import { computed, ref } from "vue";

import Counter from "./Counter.vue";

const showCounter = ref(true);
const initialCount = ref(0);
const step = ref(1);

const counterKey = computed(
	() =>
		`${initialCount.value}:${step.value}:${showCounter.value ? "on" : "off"}`,
);

const toggle = () => {
	showCounter.value = !showCounter.value;
};

const updateInitial = (value: number) => {
	initialCount.value = value;
};

const updateStep = (value: number) => {
	step.value = value <= 0 ? 1 : value;
};
</script>

<template>
	<div class="app">
		<div class="playground">
			<header class="playground__header">
				<h1>Sigrea Playground</h1>
				<p>Adapter: Vue</p>
			</header>

			<section class="playground__controls">
				<button type="button" class="playground__toggle" @click="toggle">
					{{ showCounter ? "Unmount Counter" : "Mount Counter" }}
				</button>

				<div class="playground__inputs">
					<label class="playground__input">
						<span>Initial count</span>
						<input
							type="number"
							:value="initialCount"
							@input="updateInitial(Number.parseInt(($event.target as HTMLInputElement).value, 10) || 0)"
						/>
					</label>
					<label class="playground__input">
						<span>Step</span>
						<input
							type="number"
							min="1"
							:value="step"
							@input="updateStep(Number.parseInt(($event.target as HTMLInputElement).value, 10) || 1)"
						/>
					</label>
				</div>
			</section>

			<section class="playground__canvas">
				<Counter
					v-if="showCounter"
					:key="counterKey"
					:initial-count="initialCount"
					:step="step"
				/>
				<div v-else class="playground__placeholder">
					Counter is currently unmounted.
				</div>
			</section>
		</div>
	</div>
</template>
