# @sigrea/vue

`@sigrea/vue` adapts [@sigrea/core](https://www.npmjs.com/package/@sigrea/core) logic modules and signals for Vue 3's Composition API. It aligns lifecycle scopes with component lifecycles, preserves deep reactivity, and provides composables for `<script setup>` and traditional setup functions.

- **Signal subscriptions.** `useSignal` subscribes to signals and computed values, returning a readonly ref that updates when they change.
- **Computed subscriptions.** `useComputed` subscribes to computed values, mirroring Vue's `computed` while tracking through Sigrea scopes.
- **Deep signal subscriptions.** `useDeepSignal` subscribes to deep signal objects and exposes them as mutable refs with automatic cleanup.
- **Two-way bindings.** `useMutableSignal` wraps primitive signals as `WritableComputedRef` for two-way bindings like `v-model`.
- **Logic lifecycles.** `useLogic` mounts logic factories and binds their lifecycles to Vue components.

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
  - [Consume a Signal](#consume-a-signal)
  - [Bridge Framework-Agnostic Logic](#bridge-framework-agnostic-logic)
  - [Bind Writable Primitive Signals](#bind-writable-primitive-signals)
  - [Bind Deep Reactive Objects](#bind-deep-reactive-objects)
- [API Reference](#api-reference)
  - [useSignal](#usesignal)
  - [useComputed](#usecomputed)
  - [useDeepSignal](#usedeepsignal)
  - [useMutableSignal](#usemutablesignal)
  - [useLogic](#uselogic)
- [Testing](#testing)
- [Development](#development)
- [License](#license)

## Install

```bash
npm install @sigrea/vue @sigrea/core vue
```

Requires Vue 3.4+ and Node.js 20 or later.

## Quick Start

### Consume a Signal

```vue
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

### Bridge Framework-Agnostic Logic

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

```vue
<!-- Counter.vue -->
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

### Bind Writable Primitive Signals

```vue
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

### Bind Deep Reactive Objects

```vue
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

## API Reference

### useSignal

```ts
function useSignal<T>(
  signal: Signal<T> | ReadonlySignal<T>
): DeepReadonly<ShallowRef<T>>
```

Subscribes to a signal or computed value and returns a readonly Vue ref that updates when the signal changes. The subscription is cleaned up when the component unmounts.

### useComputed

```ts
function useComputed<T>(source: Computed<T>): DeepReadonly<ShallowRef<T>>
```

Subscribes to a computed value and returns a readonly Vue ref that updates when the computed value changes. The subscription is cleaned up when the component unmounts.

### useDeepSignal

```ts
function useDeepSignal<T extends object>(signal: DeepSignal<T>): ShallowRef<T>
```

Subscribes to a deep signal and returns a mutable Vue ref. Updates to the deep signal trigger reactivity, and the subscription is cleaned up when the component unmounts. Templates unwrap the ref automatically, so accessing nested properties requires no `.value`. In script blocks, use `state.value` to access the underlying object.

### useMutableSignal

```ts
function useMutableSignal<T>(signal: Signal<T>): WritableComputedRef<T>
```

Wraps a Sigrea signal as a Vue `WritableComputedRef` for two-way bindings like `v-model`. Expects a writable signal created by `signal()`. Passing a readonly signal throws at runtime.

### useLogic

```ts
function useLogic<TReturn extends object, TProps = void>(
  logic: LogicFunction<TReturn, TProps>,
  ...args: LogicArgs<TProps>
): LogicInstance<TReturn>
```

Mounts a logic factory and returns its LogicInstance. Sigrea augments the logic with lifecycle metadata: `onMount` callbacks run after the component mounts, and `onUnmount` callbacks run before it unmounts.

## Testing

```ts
// tests/Counter.test.ts
import { mount } from "@vue/test-utils";
import { cleanupLogics } from "@sigrea/core";
import Counter from "../components/Counter.vue";

afterEach(() => cleanupLogics());

it("increments and displays the updated count", async () => {
  const wrapper = mount(Counter, {
    props: { initialCount: 10 },
  });

  await wrapper.find("button").trigger("click");

  expect(wrapper.text()).toContain("11");
});
```

## Development

Development scripts prefer pnpm. npm or yarn work too, but pnpm keeps dependency resolution identical to CI.

- `pnpm install` — install dependencies.
- `pnpm test` — run the Vitest suite once (no watch).
- `pnpm build` — compile via unbuild to produce dual CJS/ESM bundles.
- `pnpm dev` — launch the playground counter demo.

## License

MIT — see [LICENSE](./LICENSE).
