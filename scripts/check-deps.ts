import { $ } from "bun"; async function checkDeps() {
    try {
        const output = await $`docker compose ps --filter "status=running" -q`.text();
        const allServices = await $`docker compose config --services`.text();

        const runningCount = output.trim().split("\n").filter(Boolean).length;
        const totalCount = allServices.trim().split("\n").filter(Boolean).length;

        if (runningCount > 0 && runningCount === totalCount) {
            console.log("✓ All dependencies are already running.");
        } else {
            console.log("↻ Starting missing dependencies...");
            await $`docker compose up -d --wait`;
        }
    } catch (error) {
        console.log("↻ Starting dependencies...");
        await $`docker compose up -d --wait`;
    }
}

await checkDeps();