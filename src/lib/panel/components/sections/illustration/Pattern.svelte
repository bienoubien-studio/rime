<script lang="ts">
	let dotSize = 2;
	let dotGap = 40;
	let dotColor = 'hsla(0, 0%, 100%, 0.5)';
	// Using HSL for better color control
	let gradient = {
		start: 'hsl(230, 17%, 5%)', // Deep blue
		middle: 'hsl(210, 20%, 12%)', // Purple
		end: 'hsl(200, 18%, 18%)' // Pink
	};
</script>

<div
	class="pattern"
	style:--dot-size="{dotSize}px"
	style:--dot-gap="{dotGap}px"
	style:--dot-color={dotColor}
	style:--gradient-start={gradient.start}
	style:--gradient-middle={gradient.middle}
	style:--gradient-end={gradient.end}
>
	<slot />
</div>

<style>
	.pattern {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			var(--gradient-start),
			var(--gradient-middle) 50%,
			var(--gradient-end)
		);
	}

	.pattern::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image: radial-gradient(
			var(--dot-color) calc(var(--dot-size) / 2),
			transparent calc(var(--dot-size) / 2)
		);
		background-size: var(--dot-gap) var(--dot-gap);
		background-position: center;
		/* Subtle gradient mask for depth */
		mask-image: linear-gradient(45deg, hsla(0, 0%, 0%, 0.1), hsla(0, 0%, 0%, 0.4));
	}
</style>
