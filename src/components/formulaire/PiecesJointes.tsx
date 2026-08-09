import { useRef } from "react";
import { Paperclip, X, FileText, Image, File } from "lucide-react";
import type { PieceJointe } from "@/types";

interface PiecesJointesProps {
  pieces: PieceJointe[];
  onChange: (pieces: PieceJointe[]) => void;
  disabled?: boolean;
}

const TAILLE_MAX = 2 * 1024 * 1024; // 2 Mo
const TYPES_ACCEPTES = ".pdf,.jpg,.jpeg,.png,.doc,.docx";

function iconeType(type: string) {
  if (type.startsWith("image/")) return <Image size={12} color="#0369A1" />;
  if (type.includes("pdf")) return <FileText size={12} color="#B91C1C" />;
  return <File size={12} color="#6B6A60" />;
}

function formatterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function PiecesJointes({ pieces, onChange, disabled }: PiecesJointesProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function ajouterFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = e.target.files;
    if (!fichiers) return;

    for (const fichier of Array.from(fichiers)) {
      if (fichier.size > TAILLE_MAX) {
        alert(`Le fichier "${fichier.name}" depasse la taille maximale de 2 Mo.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        const pj: PieceJointe = {
          id: `pj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          nom: fichier.name,
          type: fichier.type,
          taille: fichier.size,
          data,
          date_ajout: new Date().toISOString(),
        };
        onChange([...pieces, pj]);
      };
      reader.readAsDataURL(fichier);
    }

    // Reset input pour permettre le même fichier
    if (inputRef.current) inputRef.current.value = "";
  }

  function supprimer(id: string) {
    onChange(pieces.filter((p) => p.id !== id));
  }

  return (
    <div style={{ border: "1px solid #E4E1D6", borderRadius: 7, padding: "10px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: pieces.length > 0 ? 8 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Paperclip size={13} color="#6B6A60" />
          <span style={{ fontWeight: 600, fontSize: 12 }}>Pieces jointes</span>
          {pieces.length > 0 && (
            <span style={{ fontSize: 10, background: "#EDEAE0", color: "#6B6A60", padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>
              {pieces.length}
            </span>
          )}
        </div>
        {!disabled && (
          <label
            style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#1E3A5F", fontWeight: 600, cursor: "pointer" }}
          >
            <input
              ref={inputRef}
              type="file"
              accept={TYPES_ACCEPTES}
              multiple
              onChange={ajouterFichier}
              style={{ display: "none" }}
            />
            <Paperclip size={11} /> Ajouter
          </label>
        )}
      </div>

      {pieces.length === 0 && (
        <p style={{ fontSize: 11, color: "#A6A399", textAlign: "center", padding: "6px 0", margin: 0, fontStyle: "italic" }}>
          Aucune piece jointe. PDF, images ou documents (2 Mo max).
        </p>
      )}

      {pieces.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {pieces.map((pj) => (
            <div key={pj.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "#FAFAF7", borderRadius: 5, border: "1px solid #E4E1D6" }}>
              {iconeType(pj.type)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pj.nom}</p>
                <p style={{ fontSize: 9, color: "#A6A399", margin: 0 }}>{formatterTaille(pj.taille)}</p>
              </div>
              {pj.type.startsWith("image/") && (
                <img src={pj.data} alt="" style={{ width: 28, height: 28, borderRadius: 3, objectFit: "cover" }} />
              )}
              {!disabled && (
                <button
                  onClick={() => supprimer(pj.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#A6A399" }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
