import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
 testDir:"./e2e-local",timeout:60000,workers:1,
 use:{baseURL:"http://127.0.0.1:3001"},
 projects:[{name:"desktop",use:{...devices["Desktop Chrome"]}},{name:"mobile",use:{...devices["Pixel 7"]}}],
 webServer:{command:"node ../../scripts/dev-local.mjs",url:"http://127.0.0.1:3001/login",reuseExistingServer:true,timeout:120000},
});
