const preprocess = require("svelte-preprocess");

/**
 * This will add autocompletion if you're working with SvelteKit
 *
 * @type {import('@sveltejs/kit').Config}
 */
const config = {
  emitCss: true,
  preprocess: preprocess(),
};

module.exports = config;
