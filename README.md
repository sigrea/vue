# @sigrea/vue

`@sigrea/vue` adapts [@sigrea/core](https://www.npmjs.com/package/@sigrea/core) molecule modules and signals for Vue 3's Composition API. It aligns lifecycle scopes with component lifecycles, preserves deep reactivity, and provides composables for `<script setup>` and traditional setup functions.

- **Signal subscriptions.** `useSignal` subscribes to signals and computed values, returning a readonly ref that updates when they change.
- **Computed subscriptions.** `useComputed` subscribes to computed values, mirroring Vue's `computed` while tracking through Sigrea scopes.
- **Deep signal subscriptions.** `useDeepSignal` subscribes to deep signal objects and exposes them as mutable refs with automatic cleanup.
- **Two-way bindings.** `useMutableSignal` wraps primitive signals as `WritableComputedRef` for two-way bindings like `v-model`.
- **Molecule lifecycles.** `useMolecule` mounts molecule factories and binds their lifecycles to Vue components.

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
  - [Consume a Signal](#consume-a-signal)
  - [Bridge Framework-Agnostic Molecules](#bridge-framework-agnostic-molecules)
  - [Bind Writable Primitive Signals](#bind-writable-primitive-signals)
  - [Bind Deep Reactive Objects](#bind-deep-reactive-objects)
- [API Reference](#api-reference)
  - [useSignal](#usesignal)
  - [useComputed](#usecomputed)
  - [useDeepSignal](#usedeepsignal)
  - [useMutableSignal](#usemutablesignal)
  - [useMolecule](#usemolecule)
- [Testing](#testing)
- [Handling Scope Cleanup Errors](#handling-scope-cleanup-errors)
- [Development](#development)
- [License](#license)

## Install

```bash
npm install @sigrea/vue @sigrea/core vue
```

Install `@sigrea/use` as well when shared molecules use utilities such as
`createEvents`.

Requires Vue 3.4+ and Node.js 24 or later.

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

### Bridge Framework-Agnostic Molecules

```ts
// DialogMolecule.ts
import {
  computed,
  get,
  molecule,
  readonly,
  signal,
  toSignal,
} from "@sigrea/core";
import { createEvents } from "@sigrea/use";

type DialogProps = {
  open: boolean;
  disabled?: boolean;
};

type DialogEvents = {
  "update:open": [next: boolean];
};

export const DialogMolecule = molecule<DialogProps>((props) => {
  const { send, on } = createEvents<DialogEvents>();
  const isOpen = toSignal(props, "open");
  const isDisabled = computed(() => props.disabled ?? false);

  const requestOpenChange = async (next: boolean) => {
    if (isDisabled.value || isOpen.value === next) {
      return;
    }
    await send("update:open", next);
  };

  return {
    on,
    requestOpenChange,
  };
});

export const DialogControllerMolecule = molecule(() => {
  const isOpen = signal(false);
  const dialog = get(DialogMolecule, () => ({
    open: isOpen.value,
  }));

  dialog.on("update:open", (next) => {
    isOpen.value = next;
  });

  return {
    isOpen: readonly(isOpen),
    requestOpenChange: dialog.requestOpenChange,
  };
});
```

```vue
<!-- DialogButton.vue -->
<script setup lang="ts">
import { useMolecule, useSignal } from "@sigrea/vue";
import { DialogControllerMolecule } from "./DialogMolecule";

const dialog = useMolecule(DialogControllerMolecule);
const isOpen = useSignal(dialog.isOpen);
</script>

<template>
  <button @click="dialog.requestOpenChange(!isOpen)">
    {{ isOpen ? "Close" : "Open" }}
  </button>
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

const profile = deepSignal({ name: "Mendako" });
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
  signal: Signal<T> | ReadonlySignal<T> | Computed<T>
): DeepReadonly<ShallowRef<T>>
```

Subscribes to a signal or computed value and returns a readonly Vue ref that updates when the signal changes. The subscription is cleaned up when the component unmounts, or after server rendering, including any `onServerPrefetch()` work, completes. Templates unwrap the ref automatically. In script blocks, access the current value with `value.value`.

Unlike the React adapter, this hook returns a readonly ref rather than the unwrapped value.

### useComputed

```ts
function useComputed<T>(source: Computed<T>): DeepReadonly<ShallowRef<T>>
```

Subscribes to a computed value and returns a readonly Vue ref that updates when the computed value changes. The subscription is cleaned up when the component unmounts, or after server rendering, including any `onServerPrefetch()` work, completes.

### useDeepSignal

```ts
function useDeepSignal<T extends object>(signal: DeepSignal<T>): ShallowRef<T>
```

Subscribes to a deep signal and returns a mutable Vue ref. Updates to the deep signal trigger reactivity, and the subscription is cleaned up when the component unmounts, or after server rendering, including any `onServerPrefetch()` work, completes. Templates unwrap the ref automatically, so accessing nested properties requires no `.value`. In script blocks, use `state.value` to access the underlying object.

### useMutableSignal

```ts
function useMutableSignal<T>(signal: Signal<T>): WritableComputedRef<T>
```

Wraps a Sigrea signal as a Vue `WritableComputedRef` for two-way bindings like `v-model`. Expects a writable signal created by `signal()`. Passing a readonly signal throws at runtime.

### useMolecule

```ts
function useMolecule<TReturn extends object, TProps extends object | void = void>(
  molecule: MoleculeFactory<TReturn, TProps>,
  ...args: MoleculeGetArgs<TProps>
): MoleculeInstance<TReturn, TProps>
```

Mounts a molecule factory and returns its MoleculeInstance. Sigrea augments the molecule with lifecycle metadata: `onMount` callbacks run after the component mounts, and `onUnmount` callbacks run before it unmounts.

**Server Rendering**

During server rendering, `useMolecule` creates the molecule instance for the render pass but does not mount it. `onMount`, `watch`, `watchEffect`, `onActivated`, and `onDeactivated` do not run on the server. Unmounted instances created during SSR are disposed automatically in a microtask after server rendering, including any `onServerPrefetch()` work, completes.

**KeepAlive Support**

When used inside Vue's `<KeepAlive>`, `useMolecule` pauses molecule mount-scope
work while a component is cached and resumes it on reactivation:

- **On deactivation** (`onDeactivated`): `watch` effects and ongoing work are paused via `unmountMolecule`. The molecule instance itself remains alive, preserving its internal state.
- **On reactivation** (`onActivated`): Side effects resume via `mountMolecule`, allowing watches and subscriptions to pick up where they left off.
- **On final unmount**: The molecule is fully disposed via `disposeMolecule`, releasing all resources.

`unmountMolecule`, `mountMolecule`, and `disposeMolecule` are called internally
by `useMolecule`. This prevents unnecessary molecule-side work while components
are cached but invisible, without losing molecule state. Adapter-level live
props sync created from a props getter remains active until final disposal.

**Props Handling**

`useMolecule` keeps the same molecule instance while the factory stays the same.
Passing a props object directly creates an initial snapshot. Passing a props
getter, such as `() => ({ open: props.open })` or `() => props`, syncs
top-level props into the instance through Vue's `watchEffect`. Inside a
molecule, read props as `props.name`; destructuring copies the current value and
loses reactivity.

The props getter follows Vue's reactive tracking. Adapter-level props sync stays
active until the component is finally disposed, including while a `<KeepAlive>`
component is deactivated.

Controller molecules handle `update:open`, `update:value`, and similar events
from child molecules. Vue components mount the controller molecule and read its
returned signals. If a UI wrapper needs to expose `v-model`, bridge it at the
wrapper boundary using Vue's component API. Components should not subscribe to
raw molecule events directly.

## Testing

```ts
// tests/Counter.test.ts
import { mount } from "@vue/test-utils";
import Counter from "../components/Counter.vue";

it("increments and displays the updated count", async () => {
  const wrapper = mount(Counter, {
    props: { initialCount: 10 },
  });

  await wrapper.find("button").trigger("click");

  expect(wrapper.text()).toContain("11");
});
```

## Handling Scope Cleanup Errors

For global error handling configuration, see [@sigrea/core - Handling Scope Cleanup Errors](https://github.com/sigrea/core#handling-scope-cleanup-errors).

In Vue apps, configure the handler in your application entry point before mounting:

```ts
// main.ts
import { setScopeCleanupErrorHandler } from "@sigrea/core";
import { createApp } from "vue";
import App from "./App.vue";

setScopeCleanupErrorHandler((error, context) => {
  console.error(`Cleanup failed:`, error);

  // Forward to monitoring service
  if (typeof Sentry !== "undefined") {
    Sentry.captureException(error, {
      tags: { scopeId: context.scopeId, phase: context.phase },
    });
  }
});

createApp(App).mount("#app");
```

## Development

This repo targets Node.js 24 or later.

If you use mise:

- `mise trust -y` — trust `mise.toml` (first run only).
- `pnpm -s cicheck` — run CI-equivalent checks locally.
- `mise run notes` — preview release notes (optional).

You can also run pnpm scripts directly:

- `pnpm install` — install dependencies.
- `pnpm test` — run the Vitest suite once (no watch).
- `pnpm typecheck` — run TypeScript type checking.
- `pnpm test:coverage` — collect coverage.
- `pnpm build` — compile via unbuild to produce dual CJS/ESM bundles.
- `pnpm -s cicheck` — run CI checks locally.
- `pnpm dev` — launch the playground counter demo.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for workflow details.

## License

MIT — see [LICENSE](./LICENSE).
