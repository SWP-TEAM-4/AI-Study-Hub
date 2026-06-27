import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Upload, FileText, Search, Download, MoreVertical, Tag } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { documents } from "@/lib/mock-data";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Tài liệu — Stitch" },
      { name: "description", content: "Quản lý tài liệu cá nhân: upload, tìm kiếm, lọc và tải xuống." },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string>("all");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) =>
          (type === "all" || d.type === type) &&
          (d.title.toLowerCase().includes(query.toLowerCase()) ||
            d.subject.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, type],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tài liệu</h1>
        <p className="text-muted-foreground mt-1">Tải lên, sắp xếp và tìm kiếm tài liệu học tập.</p>
      </div>

      {/* Uploader */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
        }}
        onClick={() => inputRef.current?.click()}
        className={`surface-card border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <input ref={inputRef} type="file" multiple className="hidden" />
        <div className="size-14 mx-auto mb-3 rounded-2xl bg-primary/10 text-primary grid place-items-center">
          <Upload size={24} />
        </div>
        <div className="font-display text-lg font-semibold">Kéo & thả tài liệu vào đây</div>
        <div className="text-sm text-muted-foreground mt-1">
          PDF, DOCX, PPTX, TXT · tối đa 50MB / file
        </div>
      </motion.div>

      <div className="surface-card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, môn hoặc tag..."
            className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          {["all", "pdf", "docx", "pptx", "txt"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 h-9 rounded-full text-xs font-medium uppercase ${
                type === t ? "bg-ink text-cream" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {t === "all" ? "Tất cả" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-5 py-3">Tài liệu</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Môn</th>
              <th className="text-left px-5 py-3 hidden lg:table-cell">Tags</th>
              <th className="text-left px-5 py-3 hidden sm:table-cell">Dung lượng</th>
              <th className="text-left px-5 py-3 hidden lg:table-cell">Tải</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((d, i) => (
              <motion.tr
                key={d.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="hover:bg-muted/30"
              >
                <td className="px-5 py-3">
                  <Link to="/documents/$id" params={{ id: d.id }} className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-muted grid place-items-center text-[10px] font-bold uppercase text-muted-foreground">
                      {d.type}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate hover:text-primary">{d.title}</div>
                      <div className="text-xs text-muted-foreground">{d.uploaded}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  <span className="text-xs px-2 py-0.5 rounded bg-muted">{d.subject}</span>
                </td>
                <td className="px-5 py-3 hidden lg:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {d.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                        <Tag size={9} /> {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground">{d.size}</td>
                <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground">{d.downloads}</td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground">
                      <Download size={14} />
                    </button>
                    <button className="size-8 rounded-lg hover:bg-muted grid place-items-center text-muted-foreground">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <FileText size={32} className="mx-auto mb-2 opacity-40" />
            Không có tài liệu khớp tìm kiếm.
          </div>
        )}
      </div>
    </div>
  );
}
