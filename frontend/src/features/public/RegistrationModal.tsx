import { useEffect, useRef } from 'react';
import { RegisterPage } from './RegisterPage';

export function RegistrationModal({ open, onClose, returnFocusRef }: { open: boolean; onClose: () => void; returnFocusRef: React.RefObject<HTMLElement | null> }) {
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); returnFocusRef.current?.focus(); };
  }, [open, onClose, returnFocusRef]);
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section ref={dialog} className="registration-modal" role="dialog" aria-modal="true" aria-labelledby="registration-title" onMouseDown={(event) => event.stopPropagation()}>
      <button ref={closeButton} className="modal-close" onClick={onClose} aria-label="Cerrar registro">×</button>
      <RegisterPage embedded />
    </section>
  </div>;
}
