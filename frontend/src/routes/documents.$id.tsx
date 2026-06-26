import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Share2, Trash2, Edit3, Eye, MessageSquare, Tag } from "lucide-react";
import { documents } from "@/lib/mock-data";

export const Route = createFileRoute("/documents/$id")({
  loader: ({ params }) => {
    const doc = documents.find((d) => d.id === params.id);
    if (!doc) throw notFound();
    return { doc };
  },
  component: DocumentDetail,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <h2 className="text-2xl font-bold">Tài liệu không tồn tại</h2>
      <Link to="/documents" className="text-primary mt-3 inline-block">
        ← Tất cả tài liệu
      </Link>
    </div>
  ),
});

function DocumentDetail() {
  const { doc } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <Link to="/documents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Tất cả tài liệu
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 surface-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary grid place-items-center text-xs font-bold uppercase">
              {doc.type}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold truncate">{doc.title}</h1>
              <div className="text-sm text-muted-foreground">
                {doc.subject} · {doc.size} · {doc.uploaded}
              </div>
            </div>
          </div>

          {/* Preview placeholder */}
          <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-muted to-accent grid place-items-center border border-border">
            <div className="text-center">
              <Eye size={32} className="mx-auto text-muted-foreground" />
              <div className="mt-2 text-sm text-muted-foreground">Preview tài liệu</div>
              <button className="mt-3 px-3 h-9 inline-flex items-center gap-1.5 rounded-lg bg-card border border-border text-sm font-medium">
                Mở viewer
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
              <Download size={16} /> Tải về
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-card border border-border text-sm font-medium">
              <Share2 size={16} /> Chia sẻ link
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-card border border-border text-sm font-medium">
              <Edit3 size={16} /> Sửa
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
              <Trash2 size={16} /> Xóa
            </button>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="surface-card p-5">
            <h3 className="font-display font-semibold mb-3">Metadata</h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="font-medium">Anh Khoa</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Visibility</dt>
                <dd className="font-medium">Riêng tư</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Lượt tải</dt>
                <dd className="font-medium">{doc.downloads}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Trạng thái</dt>
                <dd className="font-medium text-success">Đã xử lý</dd>
              </div>
            </dl>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground mb-1.5">Tags</div>
              <div className="flex gap-1.5 flex-wrap">
                {doc.tags.map((t: string) => (
                  <span key={t} className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded bg-accent text-accent-foreground">
                    <Tag size={10} /> {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="surface-card p-5">
            <h3 className="font-display font-semibold flex items-center gap-2 mb-2">
              <MessageSquare size={16} /> Ghi chú cá nhân
            </h3>
            <textarea
              rows={5}
              placeholder="Ghi chú ý chính, nội dung ôn tập..."
              className="w-full rounded-lg bg-muted/50 border border-transparent focus:bg-card focus:border-primary p-3 text-sm outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
