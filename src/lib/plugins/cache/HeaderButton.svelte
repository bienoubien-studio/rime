<script>
	import { DatabaseZapIcon } from '@lucide/svelte';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';

	const clearCache = async () => {
		const res = await fetch('/api/clear-cache', { method: 'post' });
		if (res.ok) {
			toast.success('Cache cleared');
		} else {
			toast.error('An error occured clearing cache');
		}
	};
</script>

<Button variant="text" icon={DatabaseZapIcon} onclick={clearCache}>Clear Cache</Button>
