"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { PiWarning, PiX } from "react-icons/pi";

interface BaseOptions {
  title: string;
  body?: string;
}

export interface ConfirmOptions extends BaseOptions {
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface PromptOptions extends BaseOptions {
  label: string;
  initial?: string;
  placeholder?: string;
  confirmLabel?: string;
  inputType?: "text" | "url";
  /** Returns the message to show when the value cannot be used. */
  validate?: (value: string) => string | null;
}

type Request =
  | ({ id: number; kind: "alert" } & BaseOptions & { resolve: () => void })
  | ({ id: number; kind: "confirm" } & ConfirmOptions & { resolve: (value: boolean) => void })
  | ({ id: number; kind: "prompt" } & PromptOptions & { resolve: (value: string | null) => void });
type NewRequest = Request extends infer Item ? (Item extends Request ? Omit<Item, "id"> : never) : never;

let nextId = 1;
let queue: Request[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const current = () => queue[0] ?? null;

function enqueue(request: NewRequest) {
  queue = [...queue, { ...request, id: nextId++ } as Request];
  emit();
}

function finish() {
  queue = queue.slice(1);
  emit();
}

export const alertDialog = (options: BaseOptions) =>
  new Promise<void>((resolve) => enqueue({ kind: "alert", ...options, resolve }));
export const confirmDialog = (options: ConfirmOptions) =>
  new Promise<boolean>((resolve) => enqueue({ kind: "confirm", ...options, resolve }));
export const promptDialog = (options: PromptOptions) =>
  new Promise<string | null>((resolve) => enqueue({ kind: "prompt", ...options, resolve }));

/** Links must be safe to place in a post or email. */
export function linkProblem(value: string) {
  return /^(https?:|mailto:|tel:)/i.test(value.trim()) ? null : "Start the link with https://, mailto: or tel:";
}

const BUTTON = "press min-h-11 border px-4 text-[10px] font-bold uppercase tracking-[0.14em] outline-none focus-visible:ring-2 focus-visible:ring-[#7fd0c1]";

function DialogCard({ request }: { request: Request }) {
  const titleId = useId();
  const bodyId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(request.kind === "prompt" ? request.initial ?? "" : "");
  const [problem, setProblem] = useState("");
  const danger = request.kind === "confirm" && request.danger;

  function cancel() {
    finish();
    if (request.kind === "alert") request.resolve();
    else if (request.kind === "confirm") request.resolve(false);
    else request.resolve(null);
  }

  function accept() {
    if (request.kind === "prompt") {
      const text = value.trim();
      const failure = text ? request.validate?.(text) ?? null : "Enter a value.";
      if (failure) return setProblem(failure);
      finish();
      request.resolve(text);
      return;
    }
    finish();
    if (request.kind === "alert") request.resolve();
    else request.resolve(true);
  }

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const target = box.current?.querySelector<HTMLElement>(danger ? "[data-dialog-cancel]" : "input, [data-dialog-accept]");
    target?.focus();
    return () => previous?.focus?.();
  }, [danger]);

  function onKeyDown(event: React.KeyboardEvent) {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    } else if (event.key === "Tab") {
      const items = [...(box.current?.querySelectorAll<HTMLElement>("button, input") ?? [])];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  const acceptLabel = request.kind === "alert" ? "OK" : request.confirmLabel ?? (request.kind === "prompt" ? "Save" : "Continue");

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/70 font-sans text-[#efebe3] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) cancel(); }}>
      <div
        ref={box}
        role={request.kind === "prompt" ? "dialog" : "alertdialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={request.body ? bodyId : undefined}
        data-kaara-dialog={request.kind}
        onKeyDown={onKeyDown}
        className="w-full max-w-md border border-white/15 bg-[#171232] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          {danger && <PiWarning size={20} className="mt-1 shrink-0 text-[#f0a08a]" aria-hidden="true" />}
          <h2 id={titleId} className="min-w-0 flex-1 break-words font-serif text-2xl leading-tight">{request.title}</h2>
          <button type="button" aria-label="Close" onClick={cancel} className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-white/60 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-[#7fd0c1]"><PiX size={17} /></button>
        </div>
        {request.body && <p id={bodyId} className="mt-2 break-words text-sm leading-relaxed text-white/65">{request.body}</p>}
        <form noValidate className="mt-5" onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); accept(); }}>
          {request.kind === "prompt" && (
            <label className="mb-4 block text-xs text-white/60">
              {request.label}
              <input
                type={request.inputType ?? "text"}
                value={value}
                placeholder={request.placeholder}
                aria-invalid={Boolean(problem)}
                onChange={(event) => { setValue(event.target.value); setProblem(""); }}
                className="mt-1.5 block min-h-11 w-full min-w-0 border border-white/15 bg-[#100b28] px-3 text-sm text-[#efebe3] outline-none placeholder:text-white/35 focus:border-[#4f9d8f]"
              />
              {problem && <span role="alert" className="mt-1.5 block text-xs text-[#f0a08a]">{problem}</span>}
            </label>
          )}
          <div className="flex justify-end gap-2">
            {request.kind !== "alert" && (
              <button type="button" data-dialog-cancel onClick={cancel} className={`${BUTTON} border-white/20`}>{request.kind === "confirm" ? request.cancelLabel ?? "Cancel" : "Cancel"}</button>
            )}
            <button type="submit" data-dialog-accept className={`${BUTTON} ${danger ? "border-[#f0a08a]/60 bg-[#f0a08a]/15 text-[#f0a08a]" : "border-[#4f9d8f] bg-[#2e7d6f] text-[#f4faf8]"}`}>{acceptLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function fieldMessage(field: Field) {
  const { validity } = field;
  if (validity.valueMissing) return field instanceof HTMLSelectElement ? "Choose an option." : "Fill in this field.";
  if (validity.typeMismatch) return field.type === "email" ? "Enter a valid email address." : field.type === "url" ? "Enter a full link, starting with https://" : "Check this value.";
  if (validity.tooShort || validity.tooLong) return "Check the length of this value.";
  if (validity.rangeUnderflow || validity.rangeOverflow || validity.stepMismatch || validity.badInput) return "Enter a valid number.";
  return "Check this value.";
}

/** Replaces the browser's form validation bubbles with one in the admin theme. */
function FieldProblem() {
  const [problem, setProblem] = useState<{ text: string; left: number; top: number; width: number } | null>(null);
  useEffect(() => {
    let handled = false;
    const clear = () => setProblem(null);
    const onInvalid = (event: Event) => {
      event.preventDefault();
      if (handled) return;
      handled = true;
      queueMicrotask(() => { handled = false; });
      const field = event.target as Field;
      field.focus({ preventScroll: true });
      field.scrollIntoView({ block: "nearest" });
      const box = field.getBoundingClientRect();
      setProblem({ text: fieldMessage(field), left: Math.max(8, box.left), top: box.bottom + 6, width: Math.min(box.width, window.innerWidth - 16) });
    };
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", clear, true);
    document.addEventListener("change", clear, true);
    window.addEventListener("scroll", clear, true);
    window.addEventListener("resize", clear);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", clear, true);
      document.removeEventListener("change", clear, true);
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("resize", clear);
    };
  }, []);
  if (!problem) return null;
  return (
    <p role="alert" data-kaara-field-error style={{ left: problem.left, top: problem.top, maxWidth: Math.max(220, problem.width) }} className="fixed z-[310] border border-[#f0a08a]/50 bg-[#171232] px-3 py-2 font-sans text-xs text-[#f0a08a] shadow-xl">
      {problem.text}
    </p>
  );
}

/** Mounted once per root layout, so every page shares one themed dialog. */
export function DialogHost() {
  const request = useSyncExternalStore(subscribe, current, () => null);
  return (
    <>
      <FieldProblem />
      {request && <DialogCard key={request.id} request={request} />}
    </>
  );
}

/**
 * Asks in the themed dialog before an in-app link abandons unsaved work.
 * Closing or reloading the tab still uses the browser's prompt, which no website can replace.
 */
export function useUnsavedLinkGuard(dirty: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (!dirty) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      void confirmDialog({
        title: "Leave without saving?",
        body: "Your unsaved changes on this page will be lost.",
        confirmLabel: "Leave page",
        cancelLabel: "Keep editing",
        danger: true,
      }).then((leave) => { if (leave) router.push(`${url.pathname}${url.search}${url.hash}`); });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty, router]);
}
