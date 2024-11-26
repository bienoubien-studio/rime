<script lang="ts">
	import { Label as LabelPrimitive } from 'bits-ui';
	import './label.css';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: LabelPrimitive.RootProps = $props();
</script>

<LabelPrimitive.Root bind:ref class="rz-label {className}" {...restProps} />
