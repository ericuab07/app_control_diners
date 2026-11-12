"use client";

import { useState } from "react";
import { Modal } from "../ui";
import { QuickNoteInput } from "./QuickNoteInput";

/** «+» → Apunt ràpid: es queda obert per apuntar-ne uns quants seguits. */
export function QuickNoteModal({ onClose }: { onClose: () => void }) {
  const [count, setCount] = useState(0);
  return (
    <Modal title="Apunt ràpid" onClose={onClose}>
      <p className="mb-3 text-sm text-muted">Apunta-ho ara i classifica-ho després des de la targeta «Apunts» d&apos;Avui.</p>
      <QuickNoteInput autoFocus onSaved={() => setCount((c) => c + 1)} />
      {count > 0 && <p role="status" className="mt-2 text-sm text-done">{count === 1 ? "Apuntat." : `${count} apunts desats.`}</p>}
    </Modal>
  );
}
