import { createPrototypeServer } from "./prototype-server.ts";
const port = Number(process.env.PORT ?? 4174);
createPrototypeServer().listen(port, "127.0.0.1", () => console.log(`Game preview: http://127.0.0.1:${port}`));
