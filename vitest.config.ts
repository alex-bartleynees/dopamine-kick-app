import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

// Dedicated Vitest config. We deliberately avoid loading the full app
// vite.config.ts (nitro, tanstackStart, PWA, react-compiler, …) so the unit
// suite stays fast and free of build-time plugins it does not need. We only
// wire up the `@/*` path alias via vite-tsconfig-paths.
export default defineConfig({
	plugins: [tsConfigPaths({ projects: ["./tsconfig.json"] })],
	test: {
		environment: "node",
		globals: false,
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		// Pin the timezone so date-formatting tests are deterministic regardless
		// of the host machine's TZ. Read at module load by src/lib/timezone.ts.
		env: { TZ: "UTC" },
	},
});
