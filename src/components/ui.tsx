import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type ConfirmOptions = { title: string; message?: string; confirmText?: string; danger?: boolean };
type Ui = { confirm: (o: ConfirmOptions) => Promise<boolean>; toast: (text: string) => void };

const UiContext = createContext<Ui | null>(null);

export function useUi(): Ui {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used inside UiProvider');
  return ctx;
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const confirm = useCallback(
    (o: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })),
    [],
  );
  const toast = useCallback((text: string) => {
    setToastText(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastText(null), 2200);
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (pending && d && !d.open) d.showModal();
  }, [pending]);

  const close = (value: boolean) => {
    pending?.resolve(value);
    dialogRef.current?.close();
    setPending(null);
  };

  return (
    <UiContext.Provider value={{ confirm, toast }}>
      {children}
      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-line bg-surface p-6 text-ink backdrop:bg-black/50"
        aria-labelledby="confirm-title"
      >
        {pending && (
          <>
            <h2 id="confirm-title" className="text-lg font-bold">{pending.title}</h2>
            {pending.message && <p className="mt-2 text-muted">{pending.message}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="btn btn-ghost" onClick={() => close(false)} autoFocus>
                Hủy
              </button>
              <button className={`btn ${pending.danger ? 'bg-danger text-white dark:text-[#1f0a0a]' : 'btn-primary'}`} onClick={() => close(true)}>
                {pending.confirmText ?? 'Đồng ý'}
              </button>
            </div>
          </>
        )}
      </dialog>
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-4">
        {toastText && (
          <div className="rounded-2xl bg-ink px-4 py-2.5 text-sm font-medium text-bg shadow-lg">{toastText}</div>
        )}
      </div>
    </UiContext.Provider>
  );
}
