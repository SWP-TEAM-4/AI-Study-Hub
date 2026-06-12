// ─────────────────────────────────────────────────────────────────────────────
// browser.ts – MSW Browser Worker Setup
// Chỉ được import khi VITE_USE_MOCK=true (dynamic import từ main.tsx)
// ─────────────────────────────────────────────────────────────────────────────

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
