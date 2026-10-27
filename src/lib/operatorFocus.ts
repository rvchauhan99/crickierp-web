/**
 * CR / operator keyboard helpers: continuous-entry focus after save.
 */

function isVisible(el: HTMLElement): boolean {
  if (el.getClientRects().length === 0) return false;
  const style = window.getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none";
}

function isDisabled(el: HTMLElement): boolean {
  if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return true;
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement || el instanceof HTMLButtonElement) {
    return el.disabled;
  }
  return false;
}

function isTabbable(el: HTMLElement): boolean {
  if (!isVisible(el) || isDisabled(el)) return false;
  const tabIndexAttr = el.getAttribute("tabindex");
  if (tabIndexAttr != null) {
    const n = Number(tabIndexAttr);
    if (!Number.isFinite(n) || n < 0) return false;
  }
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON") return true;
  if (el.isContentEditable) return true;
  if (tabIndexAttr != null && Number(tabIndexAttr) >= 0) return true;
  return false;
}

function isEmptyTextualControl(el: HTMLElement): boolean {
  if (el instanceof HTMLInputElement) {
    const type = (el.type || "text").toLowerCase();
    if (type === "hidden" || type === "checkbox" || type === "radio" || type === "button" || type === "submit" || type === "reset" || type === "file") {
      return false;
    }
    return el.value.trim() === "";
  }
  if (el instanceof HTMLTextAreaElement) {
    return el.value.trim() === "";
  }
  return false;
}

/** Collect tabbable controls under `root` in DOM order. */
export function listOperatorTabbables(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    "input, select, textarea, button, [tabindex], [contenteditable='true']",
  );
  const out: HTMLElement[] = [];
  nodes.forEach((el) => {
    if (isTabbable(el)) out.push(el);
  });
  return out;
}

/**
 * Prefer first empty text/number/search input under `root`, else first tabbable.
 * Used after a successful create so the operator starts the next record.
 */
export function focusOperatorEntryStart(root: HTMLElement | null): void {
  if (!root || typeof document === "undefined") return;
  const tabbables = listOperatorTabbables(root);
  if (tabbables.length === 0) return;
  const empty = tabbables.find(isEmptyTextualControl);
  const target = empty ?? tabbables[0];
  if (!target) return;
  try {
    target.focus({ preventScroll: false });
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      const len = target.value.length;
      try {
        target.setSelectionRange(len, len);
      } catch {
        // non-textual input types may not support selection
      }
    }
  } catch {
    // ignore focus failures (detached nodes)
  }
}

/**
 * Soft Tab trap: while focus is inside `root`, Tab/Shift+Tab cycle among
 * tabbables in that card only (does not escape to listing below / sidebar).
 * No-op when focus is outside `root` (e.g. user clicked the table).
 */
export function handleOperatorTabTrap(event: KeyboardEvent, root: HTMLElement): void {
  if (event.key !== "Tab" || event.defaultPrevented) return;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !root.contains(active)) return;

  const tabbables = listOperatorTabbables(root);
  if (tabbables.length === 0) return;

  const first = tabbables[0]!;
  const last = tabbables[tabbables.length - 1]!;

  if (event.shiftKey) {
    if (active === first || !tabbables.includes(active)) {
      event.preventDefault();
      last.focus();
    }
    return;
  }

  if (active === last || !tabbables.includes(active)) {
    event.preventDefault();
    first.focus();
  }
}
