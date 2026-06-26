// import { createFileRoute, Link } from "@tanstack/react-router";
// import { motion, AnimatePresence } from "framer-motion";
// import { BookOpen, Plus, Search, Sparkles } from "lucide-react";
// import { useMemo, useState } from "react";
// import { decks } from "@/lib/mock-data";

// export const Route = createFileRoute("/flashcards")({
//   head: () => ({
//     meta: [
//       { title: "Flashcards — Stitch" },
//       { name: "description", content: "Bộ flashcard cá nhân theo môn học." },
//     ],
//   }),
//   component: FlashcardsPage,
// });

// function FlashcardsPage() {
//   const [q, setQ] = useState("");
//   const list = useMemo(() => decks.filter((d) => d.title.toLowerCase().includes(q.toLowerCase())), [q]);

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col md:flex-row justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold flex items-center gap-2">
//             <BookOpen className="text-coral" /> Flashcards
//           </h1>
//           <p className="text-muted-foreground mt-1">Học lặp lại ngắt quãng theo thuật toán Leitner.</p>
//         </div>
//         <button className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium self-start">
//           <Sparkles size={16} /> AI tạo deck
//         </button>
//       </div>

//       <div className="surface-card p-4 relative">
//         <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
//         <input
//           value={q}
//           onChange={(e) => setQ(e.target.value)}
//           placeholder="Tìm deck..."
//           className="w-full pl-10 pr-3 h-10 rounded-xl bg-muted/60 border border-transparent focus:bg-card focus:border-primary outline-none text-sm"
//         />
//       </div>

//       <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
//         <AnimatePresence>
//           {list.map((deck, i) => {
//             const pct = Math.round((deck.mastered / deck.cards) * 100);
//             return (
//               <motion.div
//                 key={deck.id}
//                 layout
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0 }}
//                 transition={{ delay: i * 0.04 }}
//                 whileHover={{ y: -3 }}
//                 className="surface-card p-5"
//               >
//                 <div className="flex items-center justify-between mb-3">
//                   <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">{deck.subject}</span>
//                   <span className="text-xs text-muted-foreground">{deck.updated}</span>
//                 </div>
//                 <h3 className="font-display text-lg font-semibold">{deck.title}</h3>
//                 <div className="mt-3 flex items-center justify-between text-sm">
//                   <span className="text-muted-foreground">Tiến độ</span>
//                   <span className="font-medium">
//                     {deck.mastered}/{deck.cards}
//                   </span>
//                 </div>
//                 <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
//                   <motion.div
//                     className="h-full bg-gradient-to-r from-coral to-primary"
//                     initial={{ width: 0 }}
//                     animate={{ width: `${pct}%` }}
//                     transition={{ duration: 0.8, delay: i * 0.1 }}
//                   />
//                 </div>
//                 <Link
//                   to="/flashcards/$id"
//                   params={{ id: deck.id }}
//                   className="mt-4 inline-flex w-full items-center justify-center gap-1.5 h-10 rounded-xl bg-coral text-white text-sm font-medium hover:opacity-90"
//                 >
//                   <Plus size={16} /> Học deck
//                 </Link>
//               </motion.div>
//             );
//           })}
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// }
