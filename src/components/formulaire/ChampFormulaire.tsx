import type { ChampFormulaire as ChampFormDef } from "@/types";

interface ChampFormulaireProps {
  champ: ChampFormDef;
  valeur: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
}

export default function ChampFormulaire({ champ, valeur, onChange }: ChampFormulaireProps) {
  if (champ.type === "select") {
    return (
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{champ.label}</label>
        <select value={(valeur as string) || ""} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>Sélectionner…</option>
          {champ.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (champ.type === "bool") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 0" }}>
        <span style={{ fontSize: 12, fontWeight: 500 }}>{champ.label}</span>
        <button
          onClick={() => onChange(!valeur)}
          aria-pressed={!!valeur}
          style={{ width: 40, height: 22, borderRadius: 11, background: valeur ? "#1E3A5F" : "#D8D5C8", border: "none", cursor: "pointer", position: "relative", transition: "background .2s" }}
        >
          <span style={{ position: "absolute", top: 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "transform .2s", transform: valeur ? "translateX(20px)" : "translateX(2px)" }} />
        </button>
      </div>
    );
  }
  if (champ.type === "datetime") {
    return (
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{champ.label}</label>
        <input type="datetime-local" value={(valeur as string) || ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{champ.label}</label>
      <input type="text" placeholder={champ.placeholder || ""} value={(valeur as string) || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
