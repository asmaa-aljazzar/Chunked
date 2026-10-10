// drawer.js — side panel (add/edit task, AI panel...). Slides from the inline-end edge (right in LTR, left in RTL).
import { openOverlay } from "./modal.js";

export const openDrawer = (opts) => openOverlay({ ...opts, kind: "drawer" });
