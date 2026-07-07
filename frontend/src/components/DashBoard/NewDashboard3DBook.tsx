import React from "react";
import { Star } from "lucide-react";

interface BookProps {
  title: string;
  subjectCode: string;
  documentCount: number;
  color?: string; // e.g. '#89cff0' (pastel blue), '#ffa07a' (peach)
  onClick?: () => void;
  index: number;
  dateText?: string;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export function NewDashboard3DBook({ 
  title, 
  subjectCode, 
  documentCount, 
  color = "#89cff0", 
  onClick, 
  index, 
  dateText,
  onEdit,
  onDelete
}: BookProps) {
  // Generate a darker shade for the back cover to simulate 3D depth
  const darkenColor = (hex: string, percent: number) => {
    try {
      let num = parseInt(hex.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt,
        G = ((num >> 8) & 0x00ff) - amt,
        B = (num & 0x0000ff) - amt;
      return (
        "#" +
        (
          0x1000000 +
          (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x100 +
          (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x10 +
          (B < 255 ? (B < 0 ? 0 : B) : 255)
        )
          .toString(16)
          .slice(1)
      );
    } catch {
      return hex;
    }
  };

  const backColor = darkenColor(color, 15);

  return (
    <div
      onClick={onClick}
      className="book-container w-[140px] h-[200px] cursor-pointer select-none relative shrink-0 -mr-[70px] hover:-mr-[10px] transition-all duration-500 ease-out hover:z-30"
      style={{
        perspective: "1000px",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .book-container:hover .book-wrapper {
          transform: rotateY(0deg) rotateZ(0deg);
        }
        .book-container:hover .book-cover {
          transform: rotateY(-155deg);
          box-shadow: -8px 8px 20px rgba(13,28,46,0.12);
        }
        .book-container:hover .book-page-1 {
          transform: rotateY(-18deg) translateZ(12px) scale(0.98);
          box-shadow: 6px 6px 15px rgba(13,28,46,0.08);
        }
        .book-container:hover .book-page-2 {
          transform: rotateY(-12deg) translateZ(8px) scale(0.97);
          box-shadow: 5px 5px 12px rgba(13,28,46,0.07);
        }
        .book-container:hover .book-page-3 {
          transform: rotateY(-8deg) translateZ(4px) scale(0.96);
          box-shadow: 4px 4px 10px rgba(13,28,46,0.06);
        }
        .book-container:hover .book-ribbon {
          transform: rotateZ(3deg) scaleY(1.1);
        }
      `}} />

      <div
        className="book-wrapper relative w-full h-full transition-all duration-500 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(0deg) rotateZ(0deg)`,
          transformOrigin: "bottom center",
        }}
      >
        {/* Cheerful Pastel Yellow Book Ribbon */}
        <div
          className="book-ribbon absolute bottom-[-16px] left-[55%] w-2.5 h-[22px] bg-gradient-to-r from-[#fde047] to-[#eab308] rounded-b-md shadow-md transition-all duration-300 ease-out z-0 border border-[#ca8a04]/20"
          style={{
            transformOrigin: "top center",
          }}
        />

        {/* Back Cover */}
        <div
          className="absolute inset-0 w-full h-full rounded-r-xl shadow-lg border border-black/5"
          style={{
            backgroundColor: backColor,
            transform: "translateZ(-12px)",
            borderRadius: "4px 12px 12px 4px",
          }}
        />

        {/* Inner Pages Layer 3 */}
        <div
          className="book-page-3 absolute top-[6px] bottom-[6px] left-[7px] right-[2px] bg-[#fcfaf2] rounded-r-xl transition-all duration-300 ease-out shadow-sm"
          style={{
            transformOrigin: "left center",
            transform: "translateZ(-8px)",
            borderRadius: "2px 10px 10px 2px",
            border: "1px solid #e2e8f0",
            borderRight: `3px solid ${color}`,
            borderLeft: "none",
          }}
        />

        {/* Inner Pages Layer 2 */}
        <div
          className="book-page-2 absolute top-[5px] bottom-[5px] left-[6px] right-[3px] bg-[#fdfdfc] rounded-r-xl transition-all duration-300 ease-out shadow-sm"
          style={{
            transformOrigin: "left center",
            transform: "translateZ(-6px)",
            borderRadius: "2px 10px 10px 2px",
            border: "1px solid #e2e8f0",
            borderRight: `3px solid ${color}`,
            borderLeft: "none",
          }}
        />

        {/* Inner Pages Layer 1 */}
        <div
          className="book-page-1 absolute top-[4px] bottom-[4px] left-[5px] right-[4px] bg-white rounded-r-xl flex flex-col justify-between p-3.5 transition-all duration-300 ease-out shadow-sm"
          style={{
            transformStyle: "preserve-3d",
            transformOrigin: "left center",
            transform: "translateZ(-4px)",
            borderRadius: "2px 10px 10px 2px",
            border: "1px solid #e2e8f0",
            borderRight: `3px solid ${color}`,
            borderLeft: "none",
          }}
        >
          <div className="flex flex-col gap-1 relative">
            <span className="text-[8px] font-extrabold text-[#0d6683] uppercase tracking-wider">{subjectCode || "BÀI HỌC"}</span>
            {(onEdit || onDelete) && (
              <div className="absolute top-0 right-0 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {onEdit && (
                  <button 
                    onClick={onEdit}
                    className="p-0.5 rounded text-[9px] hover:bg-slate-100 transition-colors"
                    title="Chỉnh sửa"
                  >
                    ✏️
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={onDelete}
                    className="p-0.5 rounded text-[9px] hover:bg-red-50 transition-colors"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
            <h4 className="text-[11px] font-extrabold text-[#0d1c2e] line-clamp-3 leading-tight pr-7">
              {title}
            </h4>
          </div>
          
          <div className="flex flex-col gap-1.5 mt-auto">
            <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between text-[8px] text-[#475569] font-bold">
              <span>Tài liệu</span>
              <span className="bg-[#eff4ff] text-[#0d6683] px-1.5 py-0.5 rounded-full font-bold">{documentCount}</span>
            </div>
            <div className="bg-[#0d6683] text-white text-[9px] font-extrabold py-1.5 rounded-full text-center shadow-sm hover:bg-[#0a4e65] active:scale-95 transition-all">
              Vào sách 📖
            </div>
          </div>
        </div>

        {/* Front Cover (Tactile Sticker Page) */}
        <div
          className="book-cover absolute inset-0 w-full h-full rounded-r-xl flex flex-col justify-between p-3.5 text-white transition-transform duration-500 ease-out shadow-md"
          style={{
            backgroundColor: color,
            transformOrigin: "left center",
            borderRadius: "4px 12px 12px 4px",
            borderLeft: "6px solid rgba(255, 255, 255, 0.4)", // Spiral spine
            backfaceVisibility: "hidden",
            transform: "translateZ(0px)",
          }}
        >
          {/* Cute White Dashed Border */}
          <div className="absolute inset-1 border-[1.5px] border-dashed border-white/40 rounded-lg pointer-events-none" />

          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-[8px] font-extrabold text-white/90 uppercase tracking-wide">{subjectCode || "BÀI HỌC"}</span>
            <h3 className="text-[12px] font-extrabold tracking-tight leading-tight line-clamp-4 text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.15)]">
              {title}
            </h3>
          </div>

          {/* Star sticker emblem */}
          <div className="absolute top-[48%] left-[50%] -translate-x-[50%] -translate-y-[50%] text-white/30 pointer-events-none">
            <Star size={28} className="fill-white/20 stroke-[1.5]" />
          </div>

          <div className="flex justify-between items-center relative z-10 text-[8px] font-extrabold text-white/90">
            <span className="truncate max-w-[65px] italic">{dateText || "Của bé"}</span>
            <span className="shrink-0 flex items-center gap-0.5 bg-white/20 px-1.5 py-0.5 rounded-full">
              ⭐ {documentCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
