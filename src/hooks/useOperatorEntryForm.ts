"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { focusOperatorEntryStart, handleOperatorTabTrap } from "@/lib/operatorFocus";

/**
 * Continuous-entry (CR/operator) form: attach `formRef` to the entry FormContainer
 * (or wrapper). Soft Tab trap keeps focus inside the card. Call `afterSuccessfulSave()`
 * after toast + field reset so focus returns to the first empty control.
 */
export function useOperatorEntryForm() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);

  const formRef = useCallback((node: HTMLDivElement | null) => {
    rootRef.current = node;
    setRootEl(node);
  }, []);

  useEffect(() => {
    if (!rootEl) return;
    const onKeyDown = (event: KeyboardEvent) => {
      handleOperatorTabTrap(event, rootEl);
    };
    rootEl.addEventListener("keydown", onKeyDown, true);
    return () => rootEl.removeEventListener("keydown", onKeyDown, true);
  }, [rootEl]);

  const afterSuccessfulSave = useCallback(() => {
    // Double rAF: wait for React commit + Autocomplete defaultOption settle.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        focusOperatorEntryStart(rootRef.current);
      });
    });
  }, []);

  return { formRef, afterSuccessfulSave };
}
