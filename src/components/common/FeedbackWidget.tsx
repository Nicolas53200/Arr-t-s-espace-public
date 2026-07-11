import { useState } from "react";
import { MessageSquarePlus, Send, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Modal from "./Modal";

type FeedbackType = "bug" | "suggestion" | "question";

const TYPES: { value: FeedbackType; label: string; emoji: string }[] = [
  { value: "bug", label: "Signaler un bug", emoji: "🐛" },
  { value: "suggestion", label: "Suggestion", emoji: "💡" },
  { value: "question", label: "Question", emoji: "❓" },
];

export default function FeedbackWidget() {
  const [ouvert, setOuvert] = useState(false);
  const [type, setType] = useState<FeedbackType>("suggestion");
  const [message, setMessage] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  function handleSubmit() {
    if (!message.trim()) return;
    // Mock: store in localStorage for now, backend later
    const feedbacks = JSON.parse(localStorage.getItem("feedbacks") ?? "[]") as unknown[];
    feedbacks.push({
      id: `fb_${Date.now()}`,
      type,
      message: message.trim(),
      auteur: user?.nom ?? "Anonyme",
      email: user?.email ?? "",
      date: new Date().toISOString(),
      statut: "nouveau",
    });
    localStorage.setItem("feedbacks", JSON.stringify(feedbacks));
    setEnvoye(true);
    toast.success("Merci pour votre retour !");
    setTimeout(() => {
      setOuvert(false);
      setEnvoye(false);
      setMessage("");
      setType("suggestion");
    }, 1500);
  }

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        aria-label="Envoyer un feedback"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "#1E3A5F",
          color: "#FAFAF7",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(30,58,95,0.3)",
          zIndex: 150,
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(30,58,95,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(30,58,95,0.3)";
        }}
      >
        <MessageSquarePlus size={22} />
      </button>

      {ouvert && (
        <Modal onClose={() => setOuvert(false)}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 12,
            width: "100%",
            maxWidth: 420,
            padding: "24px 28px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#1C1F1B" }}>
                Contactez-nous
              </h2>
              <button
                onClick={() => setOuvert(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6B6A60", padding: 4 }}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {envoye ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#1C1F1B", margin: 0 }}>
                  Message envoye !
                </p>
                <p style={{ fontSize: 12, color: "#6B6A60", marginTop: 6 }}>
                  L'equipe vous repondra rapidement.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      style={{
                        flex: 1,
                        padding: "10px 8px",
                        borderRadius: 8,
                        border: type === t.value ? "2px solid #1E3A5F" : "1px solid #E4E1D6",
                        background: type === t.value ? "#EBF0F7" : "#FAFAF7",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: type === t.value ? 600 : 400,
                        color: "#1C1F1B",
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        textAlign: "center",
                        transition: "all 0.12s",
                      }}
                    >
                      <span style={{ display: "block", fontSize: 18, marginBottom: 4 }}>{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Decrivez votre retour, suggestion ou question..."
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 13,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    border: "1px solid #E4E1D6",
                    borderRadius: 8,
                    background: "#FAFAF7",
                    color: "#1C1F1B",
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                    marginBottom: 16,
                  }}
                />

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setOuvert(false)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      fontSize: 13,
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      background: "none",
                      border: "1px solid #E4E1D6",
                      borderRadius: 6,
                      cursor: "pointer",
                      color: "#6B6A60",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim()}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      background: message.trim() ? "#1E3A5F" : "#9CA3AF",
                      color: "#FAFAF7",
                      border: "none",
                      borderRadius: 6,
                      cursor: message.trim() ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Send size={14} />
                    Envoyer
                  </button>
                </div>

                <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 12, textAlign: "center" }}>
                  Envoye en tant que {user?.nom ?? "utilisateur"} ({user?.email ?? ""})
                </p>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
