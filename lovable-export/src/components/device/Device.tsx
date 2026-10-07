/**
 * Hey Alex — Device UI components (React + TypeScript).
 * Styling lives in src/styles/device.css; these components only emit its classes.
 * Light source is top-left. Motion: 90ms press, 120ms slide, ease-out, no springs.
 */
import * as React from "react";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* ==========================================================================
   Click sound — off by default, persisted per browser
   ========================================================================== */
const SOUND_KEY = "device.click";
const soundListeners = new Set<() => void>();
let soundOn = (() => {
  try { return localStorage.getItem(SOUND_KEY) === "on"; } catch { return false; }
})();
let audioCtx: AudioContext | null = null;
let clickBuf: AudioBuffer | null = null;

export function setClickSound(on: boolean) {
  soundOn = on;
  try { localStorage.setItem(SOUND_KEY, on ? "on" : "off"); } catch { /* storage unavailable */ }
  soundListeners.forEach((l) => l());
}

export function useClickSound(): [boolean, (on: boolean) => void] {
  const on = React.useSyncExternalStore(
    (l) => { soundListeners.add(l); return () => soundListeners.delete(l); },
    () => soundOn,
    () => false,
  );
  return [on, setClickSound];
}

export function playClick(pitch = 3200) {
  if (!soundOn || typeof window === "undefined") return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!audioCtx) {
    audioCtx = new AC();
    const len = Math.floor(audioCtx.sampleRate * 0.012);
    clickBuf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = clickBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  const src = audioCtx.createBufferSource();
  src.buffer = clickBuf;
  const bp = audioCtx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = pitch;
  bp.Q.value = 1.4;
  const g = audioCtx.createGain();
  g.gain.value = 0.5;
  src.connect(bp).connect(g).connect(audioCtx.destination);
  src.start();
}

/* Controlled-or-uncontrolled boolean state */
function useSwitchState(checked: boolean | undefined, defaultChecked: boolean, onChange?: (v: boolean) => void) {
  const [inner, setInner] = React.useState(defaultChecked);
  const value = checked ?? inner;
  const set = React.useCallback((v: boolean) => {
    if (checked === undefined) setInner(v);
    onChange?.(v);
  }, [checked, onChange]);
  return [value, set] as const;
}

/* ==========================================================================
   Silk — silkscreen label
   ========================================================================== */
export interface SilkProps extends React.HTMLAttributes<HTMLSpanElement> {
  secondary?: boolean;
  size?: "md" | "sm";
}
export function Silk({ secondary, size = "md", className, ...rest }: SilkProps) {
  return <span className={cx("silk", secondary && "silk--2", size === "sm" && "silk--sm", className)} {...rest} />;
}

/* ==========================================================================
   LED
   ========================================================================== */
export interface LedProps extends React.HTMLAttributes<HTMLSpanElement> {
  on?: boolean;
  /** signal = active item (orange). ok = done / on (green). */
  tone?: "signal" | "ok";
  size?: "md" | "lg";
}
export function Led({ on = false, tone = "signal", size = "md", className, ...rest }: LedProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("led", tone === "ok" && "led--ok", size === "lg" && "led--lg", on && "is-on", className)}
      {...rest}
    />
  );
}

/* ==========================================================================
   Key
   ========================================================================== */
export interface KeyProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** default = light key, alt = contrast (graphite in light / bone in dark), signal = THE primary action (max one per screen) */
  variant?: "default" | "alt" | "signal";
  size?: "md" | "sm";
  shape?: "square" | "round";
  wide?: boolean;
  /** Secondary legend, top-right (e.g. a shift function) */
  altLegend?: React.ReactNode;
  /** Latching key: renders aria-pressed and stays 1px in while engaged */
  latched?: boolean;
  /** Show an LED window top-left. Lit when latched (or when ledOn is set). */
  led?: boolean;
  ledOn?: boolean;
}

export const Key = React.forwardRef<HTMLButtonElement, KeyProps>(function Key(
  { variant = "default", size = "md", shape = "square", wide, altLegend, latched, led, ledOn,
    className, children, onKeyDown, onKeyUp, onBlur, onPointerDown, type = "button", ...rest },
  ref,
) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={latched === undefined ? undefined : latched}
      className={cx(
        "key",
        variant === "alt" && "key--alt",
        variant === "signal" && "key--signal",
        size === "sm" && "key--sm",
        shape === "round" && "key--round",
        wide && "key--wide",
        pressed && "is-pressed",
        className,
      )}
      onPointerDown={(e) => { if (!rest.disabled) playClick(3200); onPointerDown?.(e); }}
      onKeyDown={(e) => {
        if (!e.repeat && (e.key === " " || e.key === "Enter")) { setPressed(true); playClick(3200); }
        onKeyDown?.(e);
      }}
      onKeyUp={(e) => { setPressed(false); onKeyUp?.(e); }}
      onBlur={(e) => { setPressed(false); onBlur?.(e); }}
      {...rest}
    >
      {led && <Led on={ledOn ?? !!latched} />}
      {altLegend && <span className="key__alt">{altLegend}</span>}
      {children}
    </button>
  );
});

/* Latch group: exactly one key down, like a mode selector */
export interface KeyGroupProps<T extends string> {
  value: T;
  onValueChange: (v: T) => void;
  options: Array<{ value: T; label: React.ReactNode; ariaLabel?: string }>;
  size?: KeyProps["size"];
  "aria-label": string;
  className?: string;
}
export function KeyGroup<T extends string>({ value, onValueChange, options, size = "sm", className, ...aria }: KeyGroupProps<T>) {
  return (
    <div className={cx("keyrow", className)} role="group" aria-label={aria["aria-label"]}>
      {options.map((o) => (
        <Key key={o.value} size={size} latched={o.value === value} aria-label={o.ariaLabel} onClick={() => onValueChange(o.value)}>
          {o.label}
        </Key>
      ))}
    </div>
  );
}

/* ==========================================================================
   Toggle — pill track, raised thumb (120ms ease-out)
   ========================================================================== */
export interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Silkscreen label shown beside the track */
  label?: React.ReactNode;
  /** Show ON / OFF silkscreen that follows state */
  showState?: boolean;
  statePosition?: "before" | "after";
  /** Green LED lit while on */
  led?: boolean;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { checked, defaultChecked = false, onCheckedChange, label, showState, statePosition = "after", led,
    className, onClick, onPointerDown, ...rest },
  ref,
) {
  const [on, setOn] = useSwitchState(checked, defaultChecked, onCheckedChange);
  const state = showState && (
    <span className={cx("silk state", label ? "silk--2" : undefined)} aria-hidden="true">
      <span className="state__off">Off</span><span className="state__on">On</span>
    </span>
  );
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={on}
      className={cx("toggle", className)}
      onPointerDown={(e) => { if (!rest.disabled) playClick(2600); onPointerDown?.(e); }}
      onClick={(e) => { setOn(!on); onClick?.(e); }}
      {...rest}
    >
      {led && <Led tone="ok" on={on} />}
      {statePosition === "before" && state}
      <span className="toggle__track"><span className="toggle__thumb" /></span>
      {label && <span className="silk">{label}</span>}
      {statePosition === "after" && state}
    </button>
  );
});

/* ==========================================================================
   Rocker — durable binary settings
   ========================================================================== */
export interface RockerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Silkscreen printed above the housing: [off side, on side]. Pass null to hide. */
  legend?: [React.ReactNode, React.ReactNode] | null;
  /** Glyphs on the paddle halves */
  glyphs?: [React.ReactNode, React.ReactNode];
  size?: "md" | "sm";
  "aria-label": string;
}

export const Rocker = React.forwardRef<HTMLButtonElement, RockerProps>(function Rocker(
  { checked, defaultChecked = false, onCheckedChange, legend = ["Off", "On"], glyphs = ["O", "I"], size = "md",
    className, onClick, onPointerDown, ...rest },
  ref,
) {
  const [on, setOn] = useSwitchState(checked, defaultChecked, onCheckedChange);
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={on}
      className={cx("rocker", size === "sm" && "rocker--sm", className)}
      onPointerDown={(e) => { if (!rest.disabled) playClick(1800); onPointerDown?.(e); }}
      onClick={(e) => { setOn(!on); onClick?.(e); }}
      {...rest}
    >
      {legend && (
        <span className="rocker__legend" aria-hidden="true"><span>{legend[0]}</span><span>{legend[1]}</span></span>
      )}
      <span className="rocker__housing">
        <span className="rocker__paddle">
          <span className="rocker__half rocker__half--off">{glyphs[0]}</span>
          <span className="rocker__half rocker__half--on">{glyphs[1]}</span>
        </span>
      </span>
    </button>
  );
});

/* ==========================================================================
   Display window — the single focus item, LCD-style
   ========================================================================== */
export interface DisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  barLeft?: React.ReactNode;
  barRight?: React.ReactNode;
}
export function Display({ barLeft, barRight, className, children, ...rest }: DisplayProps) {
  return (
    <div className={cx("display", className)} {...rest}>
      {(barLeft || barRight) && (
        <div className="display__bar"><span>{barLeft}</span><span>{barRight}</span></div>
      )}
      {children}
    </div>
  );
}
export function DisplayReadout({ xl, className, ...rest }: React.HTMLAttributes<HTMLParagraphElement> & { xl?: boolean }) {
  return <p className={cx("display__readout", xl && "display__readout--xl", className)} {...rest} />;
}
export const DisplayDim = (p: React.HTMLAttributes<HTMLSpanElement>) => <span {...p} className={cx("display__dim", p.className)} />;
export const DisplayCursor = () => <span className="display__cursor" aria-hidden="true" />;

/* ==========================================================================
   Card — flat panel defined by a rule, not a shadow
   ========================================================================== */
export interface DeviceCardProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  refNo?: string;
  title: React.ReactNode;
  status?: { label: React.ReactNode; tone?: "signal" | "ok"; on?: boolean };
  footer?: React.ReactNode;
  bodyClassName?: string;
}
export function DeviceCard({ refNo, title, status, footer, className, bodyClassName, children, ...rest }: DeviceCardProps) {
  return (
    <article className={cx("card", className)} {...rest}>
      <header className="card__head">
        {refNo && <span className="card__ref">{refNo}</span>}
        <span className="silk card__title">{title}</span>
        {status && (
          <span className="card__status">
            <Led tone={status.tone ?? "ok"} on={status.on ?? true} />
            <span className="silk silk--2">{status.label}</span>
          </span>
        )}
      </header>
      <div className={cx("card__body", bodyClassName)}>{children}</div>
      {footer && <footer className="card__foot">{footer}</footer>}
    </article>
  );
}
export const CardRow = (p: React.HTMLAttributes<HTMLDivElement>) => <div {...p} className={cx("card__row", p.className)} />;

/* ==========================================================================
   Field + TextInput
   ========================================================================== */
export interface FieldProps {
  label: React.ReactNode;
  refNo?: string;
  hint?: React.ReactNode;
  /** Error message. Bold border + lit LED + "ERR ·" prefix — never red. */
  error?: React.ReactNode;
  children: React.ReactElement;
  className?: string;
}
export function Field({ label, refNo, hint, error, children, className }: FieldProps) {
  const id = React.useId();
  const hintId = `${id}-hint`;
  const control = React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error || hint ? hintId : undefined,
  });
  return (
    <div className={cx("field", !!error && "is-error", className)}>
      <label className="field__label" htmlFor={id}>
        <span className="silk">{label}</span>
        {refNo && <span className="silk silk--2">{refNo}</span>}
      </label>
      {control}
      {(error || hint) && (
        <span className="field__hint" id={hintId}>
          {error && <Led on />}
          {error ? <>Err · {error}</> : hint}
        </span>
      )}
    </div>
  );
}

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Fixed prefix segment, e.g. "+1" */
  prefix?: string;
}
export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { prefix, className, ...rest },
  ref,
) {
  const input = <input ref={ref} className={cx("input", className)} {...rest} />;
  if (!prefix) return input;
  return (
    <span className="input-group">
      <span className="input-group__prefix" aria-hidden="true">{prefix}</span>
      {input}
    </span>
  );
});
