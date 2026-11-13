// Build config for the plugin's frontend.  src/index.tsx contains **no JSX**
// (React via createElement, TS types only), so the react plugin is not
// required and the bundle is a plain TS→ESM transform + minify.
export default {
  build: {
    lib: { entry: "src/index.tsx", formats: ["es"], fileName: () => "index.js" },
    rollupOptions: { external: ["react", "react-dom"] },
  },
};
