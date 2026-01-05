<script setup lang="ts">
import { ref } from "vue";

import Counter from "./Counter.vue";

const showCounter = ref(true);
const initialCount = ref(0);
const initialStep = ref(1);

const toggle = () => {
	showCounter.value = !showCounter.value;
};

const updateInitialCount = (value: number) => {
	initialCount.value = value;
};

const updateInitialStep = (value: number) => {
	initialStep.value = value <= 0 ? 1 : value;
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
							:disabled="showCounter"
							@input="updateInitialCount(Number.parseInt(($event.target as HTMLInputElement).value, 10) || 0)"
						/>
					</label>
					<label class="playground__input">
						<span>Initial step</span>
						<input
							type="number"
							min="1"
							:value="initialStep"
							:disabled="showCounter"
							@input="updateInitialStep(Number.parseInt(($event.target as HTMLInputElement).value, 10) || 1)"
						/>
					</label>
				</div>
			</section>

			<section class="playground__canvas">
				<Counter
					v-if="showCounter"
					:initial-count="initialCount"
					:initial-step="initialStep"
				/>
				<div v-else class="playground__placeholder">
					Counter is currently unmounted.
				</div>
			</section>
		</div>
	</div>
</template>
