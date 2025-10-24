# @sigrea/vue

`@sigrea/vue` adapts [@sigrea/core](https://www.npmjs.com/package/@sigrea/core) logic modules and signals to Vue 3’s Composition API. It keeps lifecycle scopes aligned with component mounts, forwards deep reactivity, and ships composables that feel first-class inside `<script setup>` or traditional setup functions.

## Installation

```bash
pnpm add @sigrea/vue @sigrea/core vue
```

Vue 3.4+ and Node.js 20+ are required. Equivalent npm or yarn commands work as expected.

## What This Adapter Provides

- **Signal readers** – `useSignal` consumes shallow signals and computed values inside Vue components.
- **Deep signal access** – `useDeepSignal` exposes deeply reactive objects with automatic cleanup.
- **Derived state** – `useComputed` mirrors Vue’s `computed`, but tracks through Sigrea scopes.
- **Logic lifecycles** – `useLogic` mounts `defineLogic` factories while honoring `onMount` / `onUnmount`.
- **Snapshots** – `useSnapshot` grants direct access to low-level signal handlers when needed.
- **Writable bridge** – `useMutableSignal` exposes primitive `signal()` values as `WritableComputedRef`s for two-way bindings.

## Quick Start

### Consume a signal

```ts
<script setup lang="ts">
import { signal } from "@sigrea/core";
import { useSignal } from "@sigrea/vue";

const count = signal(0);
const value = useSignal(count);
</script>

<template>
	<span>{{ value }}</span>
</template>
```

### Bridge framework-agnostic logic

```ts
// CounterLogic.ts
import { defineLogic, signal } from "@sigrea/core";

export const CounterLogic = defineLogic<{ initialCount: number }>()((props) => {
	const count = signal(props.initialCount);

	const increment = () => {
		count.value += 1;
	};

	const reset = () => {
		count.value = props.initialCount;
	};

	return { count, increment, reset };
});
```

```ts
// Counter.vue
<script setup lang="ts">
import { useLogic, useSignal } from "@sigrea/vue";

import { CounterLogic } from "./CounterLogic";

const props = defineProps<{ initialCount: number }>();
const counter = useLogic(CounterLogic, props);
const value = useSignal(counter.count);
</script>

<template>
	<div>
		<span>{{ value }}</span>
		<button @click="counter.increment">Increment</button>
		<button @click="counter.reset">Reset</button>
	</div>
</template>
```

### Bind writable primitive signals

```ts
<script setup lang="ts">
import { signal } from "@sigrea/core";
import { useMutableSignal } from "@sigrea/vue";

const count = signal(0);
const model = useMutableSignal(count);
</script>

<template>
	<label>
		Count
		<input type="number" v-model.number="model" />
	</label>
</template>
```

`useMutableSignal` expects a writable signal produced by `signal()`. Passing a readonly signal throws at runtime so incorrect bindings fail fast.

### Bind deep reactive objects

```ts
<script setup lang="ts">
import { deepSignal } from "@sigrea/core";
import { useDeepSignal } from "@sigrea/vue";

const profile = deepSignal({ name: "Sigrea" });
const model = useDeepSignal(profile);
</script>

<template>
	<label>
		Name
		<input v-model="model.name" />
	</label>
</template>
```

## Development

- `pnpm install` – install dependencies
- `pnpm test` – run the Vitest suite
- `pnpm build` – emit distributable artifacts
- `pnpm dev` – launch the playground counter demo

## License

MIT — see `LICENSE`.
