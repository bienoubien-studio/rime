<script lang="ts">
  import { getLiveContext } from '$src/lib/cms/panel/context/live.svelte';
  import RenderRichText from '$src/lib/front/components/utils/RenderRichText.svelte';

  type Props = { data: { doc: CMS.InfosDoc } };
  const { data }: Props = $props();

  const live = getLiveContext();

  $effect(() => {
    if (live.enabled) {
      live.doc = data.doc;
    }
  });

  const doc = $derived(live.doc || data.doc);
</script>

<main class="grid space-y-4 p-8">
  <RenderRichText class="max-w-prose" content={doc.about.content} />
  <a class="underline underline-offset-2" href="mailto:{doc.email}">contact</a>
  <a class="underline underline-offset-2" href="https://instagram.com/{doc.instagram}">
    {doc.instagram}
  </a>
</main>
