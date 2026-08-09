import { useRef, useState, useEffect, useCallback } from "react";
import { Pen, RotateCcw, Check } from "lucide-react";

interface SignaturePadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  disabled?: boolean;
}

export default function SignaturePad({ value, onChange, disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(!!value);
  const [ouvert, setOuvert] = useState(false);

  // Charger une signature existante
  useEffect(() => {
    if (value && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, [value, ouvert]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: (touch!.clientX - rect.left) * (canvas.width / rect.width), y: (touch!.clientY - rect.top) * (canvas.height / rect.height) };
    }
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasContent(true);
  }, [disabled, getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1C1F1B";
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, disabled, getPos]);

  const endDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  function effacer() {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasContent(false);
    onChange(undefined);
  }

  function valider() {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onChange(dataUrl);
    setOuvert(false);
  }

  // Affichage compact quand fermé
  if (!ouvert) {
    return (
      <div style={{ border: "1px solid #E4E1D6", borderRadius: 7, padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Pen size={13} color="#1E3A5F" />
            <span style={{ fontWeight: 600, fontSize: 12 }}>Signature numerique</span>
            {value && (
              <span style={{ fontSize: 10, background: "#D1FAE5", color: "#065F46", padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>
                ✓ Signee
              </span>
            )}
          </div>
          {!disabled && (
            <button
              onClick={() => setOuvert(true)}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #E4E1D6", background: "#FFFFFF", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500, color: "#1E3A5F" }}
            >
              {value ? "Modifier" : "Signer"}
            </button>
          )}
        </div>
        {value && (
          <div style={{ marginTop: 8, background: "#FAFAF7", borderRadius: 5, padding: 8, textAlign: "center" }}>
            <img src={value} alt="Signature" style={{ maxHeight: 50, opacity: 0.8 }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #E4E1D6", borderRadius: 7, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Pen size={13} color="#1E3A5F" />
        <span style={{ fontWeight: 600, fontSize: 12 }}>Signez ci-dessous</span>
      </div>
      <div style={{ border: "1px solid #D8D5C8", borderRadius: 5, overflow: "hidden", background: "#FFFFFF", touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          style={{ width: "100%", height: 120, cursor: disabled ? "default" : "crosshair", display: "block" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
        <button
          onClick={effacer}
          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #E4E1D6", background: "#FFFFFF", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", color: "#6B6A60" }}
        >
          <RotateCcw size={10} /> Effacer
        </button>
        <button
          onClick={() => setOuvert(false)}
          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "1px solid #E4E1D6", background: "#FFFFFF", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif", color: "#6B6A60" }}
        >
          Annuler
        </button>
        <button
          onClick={valider}
          disabled={!hasContent}
          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 10px", borderRadius: 5, border: "none", background: hasContent ? "#2F6B4F" : "#D8D5C8", color: "#FAFAF7", cursor: hasContent ? "pointer" : "not-allowed", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}
        >
          <Check size={10} /> Valider
        </button>
      </div>
    </div>
  );
}
