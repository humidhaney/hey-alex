/**
 * /components — Device UI component sheet. Light, dark, or both side by side.
 * Uses the Tailwind token bridge (tailwind.device.ts) for layout colors.
 */
import * as React from "react";
import {
  CardRow, DeviceCard, Display, DisplayCursor, DisplayDim, DisplayReadout, Field, Key, KeyGroup,
  Led, Rocker, Silk, TextInput, Toggle, useClickSound, playClick,
} from "@/components/device/Device";

type View = "light" | "dark" | "split";

/* ---- Contrast measurement (live, from the pane's computed tokens) ---- */
const PAIRS: Array<[string | string[], string, string, number]> = [
  ["--ink", "--body", "Content, labels", 4.5],
  ["--ink-2", "--body", "Secondary labels", 4.5],
  ["--well-ink", "--well", "Display / input text", 4.5],
  ["--well-ink-2", "--well", "Display bar", 4.5],
  ["--ink-2", "--well", "Placeholder", 4.5],
  ["--key-ink", "--key", "Key legend", 4.5],
  ["--key-alt-ink", "--key-alt", "Contrast key legend", 4.5],
  ["--signal-ink", "--signal", "Signal key legend", 4.5],
  ["--key-line", "--body", "Key / field outline", 3],
  [["--signal", "--signal-edge"], "--body", "Lit LED (active) · fill or ring", 3],
  [["--ok", "--ok-line"], "--body", "Lit LED (done) · fill or ring", 3],
  ["--focus", "--body", "Focus ring", 3],
];
const SWATCHES = ["--body", "--ink", "--ink-2", "--well", "--key", "--key-alt", "--signal", "--ok", "--rule"];

function lum(hex: string) {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const x = parseInt(full.slice(i, i + 2), 16) / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string) => {
  const [l1, l2] = [lum(a), lum(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

function Tokens() {
  // Measures from its own element: tokens inherit from the nearest [data-theme].
  const ref = React.useRef<HTMLDivElement>(null);
  const [vals, setVals] = React.useState<Record<string, string>>({});
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const cs = getComputedStyle(ref.current);
    const names = new Set<string>(SWATCHES);
    PAIRS.forEach(([f, b]) => { [f].flat().forEach((n) => names.add(n)); names.add(b); });
    const out: Record<string, string> = {};
    names.forEach((n) => { out[n] = cs.getPropertyValue(n).trim(); });
    setVals(out);
  }, []);
  return (
    <div ref={ref}>
      {vals["--body"] && <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] border-l border-t border-rule">
        {SWATCHES.map((t) => (
          <div key={t} className="grid gap-2 border-b border-r border-rule p-2.5">
            <div className="h-11 rounded border border-[var(--key-line)]" style={{ background: `var(${t})` }} />
            <Silk>{t.slice(2)}</Silk>
            <Silk secondary>{vals[t]?.toUpperCase()}</Silk>
          </div>
        ))}
      </div>
      <table className="mt-5 w-full border-collapse text-[13px]">
        <thead>
          <tr>{["Pair", "Use", "Ratio", "Need", "Result"].map((h) => (
            <th key={h} className="border-b border-rule py-2 pr-2 text-left"><Silk secondary>{h}</Silk></th>
          ))}</tr>
        </thead>
        <tbody>
          {PAIRS.map(([fg, bg, use, need]) => {
            const fgs = [fg].flat();
            const r = Math.max(...fgs.map((f) => ratio(vals[f], vals[bg])));
            const pass = r >= need;
            return (
              <tr key={use}>
                <td className="border-b border-rule py-2 pr-2">
                  <span className="inline-flex h-6 w-10 items-center justify-center rounded border border-[var(--key-line)] font-label text-[11px] font-bold"
                    style={{ background: `var(${bg})`, color: `var(${fgs[0]})` }}>Aa</span>
                </td>
                <td className="border-b border-rule py-2 pr-2">{use}</td>
                <td className="border-b border-rule py-2 pr-2 font-label tabular-nums">{r.toFixed(1)}:1</td>
                <td className="border-b border-rule py-2 pr-2"><Silk secondary>{need === 3 ? "UI 3:1" : "AA 4.5:1"}</Silk></td>
                <td className="border-b border-rule py-2 pr-2">
                  <span className="inline-flex items-center gap-1.5"><Led on tone={pass ? "ok" : "signal"} /><Silk>{pass ? "Pass" : "Fail"}</Silk></span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </>}
    </div>
  );
}

/* ---- Layout primitives ---- */
function Section({ num, name, note, children }: { num: string; name: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-rule-strong pb-7 pt-[18px] sm:grid-cols-[112px_minmax(0,1fr)]">
      <div className="grid content-start gap-1.5">
        <span className="font-label text-[28px] leading-none">{num}</span>
        <Silk>{name}</Silk>
      </div>
      <div>
        {note && <p className="mb-4 max-w-[60ch] text-sm leading-normal text-ink-2">{note}</p>}
        {children}
      </div>
    </section>
  );
}
function Specimens({ wide, children }: { wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid border-l border-t border-rule ${wide ? "grid-cols-[repeat(auto-fill,minmax(260px,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(132px,1fr))]"}`}>
      {children}
    </div>
  );
}
function Specimen({ id, caption, start, children }: { id: string; caption: string; start?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid min-h-[120px] grid-rows-[1fr_auto] gap-3.5 border-b border-r border-rule px-3.5 pb-2.5 pt-4">
      <div className={`flex flex-wrap gap-2 ${start ? "items-start justify-start" : "items-center justify-center"}`}>{children}</div>
      <div className="flex justify-between gap-2"><Silk>{id}</Silk><Silk secondary>{caption}</Silk></div>
    </div>
  );
}

function useClock() {
  const fmt = () => new Date().toTimeString().slice(0, 5);
  const [t, setT] = React.useState(fmt);
  React.useEffect(() => { const i = setInterval(() => setT(fmt()), 30000); return () => clearInterval(i); }, []);
  return t;
}

/* ---- The sheet ---- */
function Sheet({ label }: { label: string }) {
  const clock = useClock();
  const [units, setUnits] = React.useState<"f" | "c">("f");
  const [hold, setHold] = React.useState(true);

  return (
    <div className="mx-auto max-w-[1040px] px-6 pb-16 pt-6">
      <div className="mb-1 flex justify-between gap-4 pb-2.5">
        <Silk>{label}</Silk>
        <Silk secondary>Light source ↖ top-left</Silk>
      </div>

      <Section num="00" name="Tokens" note="One signal color. Green appears only as a lit LED. Every pair below is measured live from this pane's tokens.">
        <Tokens />
      </Section>

      <Section num="0T" name="Type">
        <div className="grid gap-3.5">
          <Silk>Silkscreen · JetBrains Mono 600 · 11px · +0.06em</Silk>
          <p className="font-text text-[32px] font-semibold leading-tight tracking-[-0.02em]">Ask Alex. Get one clear answer.</p>
          <p className="max-w-[52ch] font-text text-base leading-normal">Content text is Inter, set dark on the housing. Labels never go gray-on-gray.</p>
        </div>
      </Section>

      <Section num="01" name="Key" note="6px radius, 1px darker bottom edge, 2px drop shadow. Press travels 2px down in 90ms and the shadow collapses.">
        <Specimens>
          <Specimen id="A" caption="Default"><Key>Menu</Key></Specimen>
          <Specimen id="B" caption="Pressed"><Key className="is-pressed" tabIndex={-1}>Menu</Key></Specimen>
          <Specimen id="C" caption="Latched"><Key led latched={hold} onClick={() => setHold(!hold)}>Hold</Key></Specimen>
          <Specimen id="D" caption="Contrast"><Key variant="alt" altLegend="Shift">Back</Key></Specimen>
          <Specimen id="E" caption="Signal"><Key variant="signal" style={{ minWidth: 96 }}>Send</Key></Specimen>
          <Specimen id="F" caption="Disabled"><Key disabled>Undo</Key></Specimen>
          <Specimen id="G" caption="Latch group">
            <KeyGroup aria-label="Units" value={units} onValueChange={setUnits} options={[{ value: "f", label: "°F" }, { value: "c", label: "°C" }]} />
          </Specimen>
          <Specimen id="H" caption="Round"><Key shape="round" aria-label="Record">Rec</Key></Specimen>
        </Specimens>
      </Section>

      <Section num="02" name="Toggle" note="Pill track, raised thumb, 120ms ease-out. On is ink, not orange.">
        <Specimens>
          <Specimen id="A" caption="Off"><Toggle label="Alerts" /></Specimen>
          <Specimen id="B" caption="On"><Toggle label="Alerts" defaultChecked /></Specimen>
          <Specimen id="C" caption="With LED"><Toggle led showState defaultChecked aria-label="Daily brief" /></Specimen>
          <Specimen id="D" caption="Disabled"><Toggle label="Beta" disabled /></Specimen>
        </Specimens>
      </Section>

      <Section num="03" name="Rocker" note="For durable binary settings. The pushed half sits in shadow; the raised half catches the light.">
        <Specimens>
          <Specimen id="A" caption="Off"><Rocker aria-label="Quiet hours" /></Specimen>
          <Specimen id="B" caption="On"><Rocker aria-label="Quiet hours" defaultChecked /></Specimen>
          <Specimen id="C" caption="Custom legend">
            <Rocker aria-label="Units: US or metric" legend={["Metric", "US"]} glyphs={["M", "US"]} defaultChecked />
          </Specimen>
        </Specimens>
      </Section>

      <Section num="04" name="LED" note="Off is flat. Orange marks the active item; green marks done or on. Always paired with a label.">
        <Specimens>
          <Specimen id="A" caption="Off"><Led size="lg" /></Specimen>
          <Specimen id="B" caption="Active"><Led size="lg" on /></Specimen>
          <Specimen id="C" caption="Done / On"><Led size="lg" tone="ok" on /></Specimen>
        </Specimens>
        <ul className="mt-5 border-t border-rule" aria-label="Threads">
          {[
            { t: "Weather · 70119", s: "Active", led: <Led on />, current: true },
            { t: "Coffee near Magazine St", s: "Done", led: <Led tone="ok" on /> },
            { t: "Saints score", s: "Idle", led: <Led /> },
          ].map((r) => (
            <li key={r.t} aria-current={r.current || undefined} className={`flex items-center gap-3 border-b border-rule px-0.5 py-3 text-[15px] ${r.current ? "font-semibold" : ""}`}>
              {r.led}<span className="flex-1">{r.t}</span><Silk secondary>{r.s}</Silk>
            </li>
          ))}
        </ul>
      </Section>

      <Section num="05" name="Display" note="The focus item. Inset, a step darker than the housing, monospace readout. One per screen.">
        <Specimens wide>
          <Specimen id="A" caption="Message readout" start>
            <Display className="w-full" role="status" aria-label="Last reply" barLeft="CH 01 · SMS" barRight={`RX ${clock}`}>
              <DisplayReadout><DisplayDim>&gt; WEATHER 70119</DisplayDim>{"\n"}78°F CLEAR{"\n"}H82 L71 RAIN 10%<DisplayCursor /></DisplayReadout>
            </Display>
          </Specimen>
          <Specimen id="B" caption="Numeric meter" start>
            <Display className="w-full" aria-label="Messages left this month" barLeft="Plan · Msgs left" barRight="Oct">
              <DisplayReadout xl>042<DisplayDim style={{ fontSize: 20 }}> / 100</DisplayDim></DisplayReadout>
            </Display>
          </Specimen>
        </Specimens>
      </Section>

      <Section num="06" name="Card" note="A flat panel defined by a rule, not a shadow. Ref number top-left, status top-right, actions bottom-right.">
        <Specimens wide>
          <Specimen id="A" caption="Action card" start>
            <DeviceCard className="w-full" refNo="01" title="Weather" status={{ label: "Synced", tone: "ok" }}
              footer={<><Key size="sm">Edit</Key><Key size="sm" variant="signal" style={{ minWidth: 72 }} onClick={() => playClick()}>Send</Key></>}>
              <p className="m-0">Text <strong>WEATHER</strong> and a zip code. Alex replies with the forecast in one message.</p>
            </DeviceCard>
          </Specimen>
          <Specimen id="B" caption="Settings card" start>
            <DeviceCard className="w-full" refNo="02" title="Settings" bodyClassName="py-1">
              <CardRow><span>Daily brief</span><Toggle aria-label="Daily brief" showState statePosition="before" defaultChecked /></CardRow>
              <CardRow><span>Quiet hours</span><Rocker aria-label="Quiet hours" size="sm" legend={null} /></CardRow>
            </DeviceCard>
          </Specimen>
        </Specimens>
      </Section>

      <Section num="07" name="Input" note="Same inset language as the display. Focus is a 2px ink ring. Errors go bold, not red.">
        <Specimens wide>
          <Specimen id="A" caption="Default" start>
            <Field className="w-full" label="Name" refNo="07.A"><TextInput placeholder="First name" autoComplete="given-name" /></Field>
          </Specimen>
          <Specimen id="B" caption="Prefixed" start>
            <Field className="w-full" label="Mobile" refNo="07.B" hint="US numbers only">
              <TextInput prefix="+1" type="tel" inputMode="tel" placeholder="504 555 0142" autoComplete="tel-national" />
            </Field>
          </Specimen>
          <Specimen id="C" caption="Error" start>
            <Field className="w-full" label="Zip" refNo="07.C" error="Zip needs 5 digits"><TextInput inputMode="numeric" defaultValue="7011" /></Field>
          </Specimen>
          <Specimen id="D" caption="Disabled" start>
            <Field className="w-full" label="Plan" refNo="07.D"><TextInput defaultValue="Basic" disabled /></Field>
          </Specimen>
        </Specimens>
      </Section>
    </div>
  );
}

export default function ComponentsPage() {
  const [view, setView] = React.useState<View>(() => {
    try {
      const v = localStorage.getItem("device.view") as View | null;
      if (v) return v;
    } catch { /* storage unavailable */ }
    return typeof window !== "undefined" && window.matchMedia("(min-width: 1101px)").matches ? "split" : "light";
  });
  const [sound, setSound] = useClickSound();

  React.useEffect(() => {
    try { localStorage.setItem("device.view", view); } catch { /* storage unavailable */ }
  }, [view]);

  const paneTheme = view === "split" ? undefined : view;

  return (
    <div data-theme={paneTheme} className="min-h-screen bg-body font-text text-ink antialiased">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-7 gap-y-4 border-b border-rule-strong bg-body px-6 pb-3 pt-3.5">
        <div className="mr-auto grid gap-1">
          <h1 className="m-0 font-label text-[13px] font-bold uppercase tracking-silk">Hey Alex · Device UI</h1>
          <Silk secondary size="sm">Component sheet · Rev A · For review</Silk>
        </div>
        <div className="flex items-center gap-2.5">
          <Silk secondary aria-hidden="true">View</Silk>
          <KeyGroup aria-label="View" value={view} onValueChange={setView}
            options={[{ value: "light", label: "Lt", ariaLabel: "Light" }, { value: "dark", label: "Dk", ariaLabel: "Dark" }, { value: "split", label: "A|B", ariaLabel: "Side by side" }]} />
        </div>
        <Toggle label="Click" showState checked={sound} onCheckedChange={(on) => { setSound(on); if (on) playClick(); }} />
      </header>

      {view === "split" ? (
        <main className="grid grid-cols-1 min-[1101px]:grid-cols-2">
          <div data-theme="light" className="min-w-0 bg-body text-ink"><Sheet key="a" label="Pane A · Light" /></div>
          <div data-theme="dark" className="min-w-0 border-t border-rule-strong bg-body text-ink min-[1101px]:border-l min-[1101px]:border-t-0"><Sheet key="b" label="Pane B · Dark" /></div>
        </main>
      ) : (
        <main className="bg-body"><Sheet key={view} label={view === "dark" ? "Dark" : "Light"} /></main>
      )}
    </div>
  );
}
