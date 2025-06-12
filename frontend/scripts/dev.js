import { build, preview } from "vite";

(async () => {
  await build({
    build: {
      minify: false,
      sourcemap: true,
      target: "esnext",
      watch: {},
    },
    mode: "development",
  });

  await preview();
})();
