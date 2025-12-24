import React from 'react';

/**
 * Hook to handle pointer interactions for dragging a drawer.
 *
 * @param {Object} props - Hook props.
 * @param {boolean} props.open - Whether the drawer is open.
 * @param {Function} props.setOpen - State setter for drawer visibility.
 * @param {React.RefObject<HTMLDivElement | null>} props.drawerRef - Ref to the drawer element.
 * @param {React.RefObject<HTMLDivElement | null>} props.headerRef - Ref to the drawer header (drag handle).
 * @param {number} props.translateY - Current vertical translation.
 * @param {Function} props.setTranslateY - Setter for vertical translation.
 * @param {Function} props.setIsDragging - Setter for dragging state.
 */
export function useDrawerDrag({
  open,
  setOpen,
  drawerRef,
  headerRef,
  translateY,
  setTranslateY,
  setIsDragging,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  drawerRef: React.RefObject<HTMLDivElement | null>;
  headerRef: React.RefObject<HTMLDivElement | null>;
  translateY: number;
  setTranslateY: (n: number) => void;
  setIsDragging: (b: boolean) => void;
}) {
  const startYRef = React.useRef<number | null>(null);
  const lastPointerId = React.useRef<number | null>(null);
  // We need to keep track of the current translateY in a ref for the event handlers
  // to avoid stale closures if we don't include it in the dependency array,
  // but including it might cause frequent re-attachments.
  // Actually, standard practice is to use a ref for mutable values in event handlers.
  const translateYRef = React.useRef(translateY);

  React.useEffect(() => {
    translateYRef.current = translateY;
  }, [translateY]);

  React.useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    const drawer = drawerRef.current;
    if (!header || !drawer) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      startYRef.current = e.clientY;
      lastPointerId.current = e.pointerId;
      setIsDragging(true);
      // Prevent default to avoid page scroll on touch devices when dragging
      try {
          (e.target as Element).setPointerCapture?.(e.pointerId);
      } catch {
          // ignore
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (startYRef.current === null) return;
      // Only handle primary pointer
      if (e.pointerId !== lastPointerId.current) return;

      // Calculate delta. Positive means dragging down (closing).
      // If we want to support dragging up from a partial state, we might need adjustments,
      // but for a "bottom sheet" that starts open/up, dragging down is closing.
      const delta = Math.max(0, e.clientY - (startYRef.current ?? 0));
      const height = Math.max(0, drawer.getBoundingClientRect().height || 0);
      const capped = Math.min(delta, height);

      setTranslateY(capped);
      try {
        // We assume the component consumes this CSS variable
        // The consumer might need to set the variable name used.
        // For now, we will stick to the one used in MobileUpgrades or make it generic?
        // Let's assume the consumer sets the style on the element based on the state or we set it here directly.
        // The original code set --mobile-upgrades-translate.
        // Let's use a generic variable name --drawer-translate.
        drawer.style.setProperty('--drawer-translate', `${capped}px`);
        // Also set the specific one for backward compatibility if we don't update CSS immediately?
        // No, we will update the consumer to use --drawer-translate or simply handle it via style prop.
        drawer.style.transform = `translateY(${capped}px)`;
      } catch {
        // ignore
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (startYRef.current === null) return;
      if (e.pointerId !== lastPointerId.current) return;

      const height = Math.max(0, drawer.getBoundingClientRect().height || 0);
      const threshold = height * 0.33;
      const finalTranslate = translateYRef.current; // Use ref to get latest value

      if (finalTranslate > threshold) {
        setOpen(false);
      } else {
        setTranslateY(0);
        drawer.style.transform = `translateY(0px)`;
        drawer.style.removeProperty('--drawer-translate');
      }
      setIsDragging(false);
      startYRef.current = null;
      lastPointerId.current = null;
      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    };

    header.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    return () => {
      header.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [open, headerRef, drawerRef, setOpen, setTranslateY, setIsDragging]); // Removed translateY from deps to avoid re-binding
}
