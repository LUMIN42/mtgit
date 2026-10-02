// Vercel serverless function entry. Requests to /trpc/* are rewritten here (see vercel.json).
// Imports the compiled API, which `npm run build` produces before functions are bundled.
export {default} from "../apps/api/dist/app.js";
