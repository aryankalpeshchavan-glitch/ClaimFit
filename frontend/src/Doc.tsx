import { Fragment } from "react";
import { buildSegments, type Mark } from "./highlight";

export interface DocProps {
  text: string;
  marks: Mark[];
  pane: "claim" | "evidence";
  selected: string | null;
  onSelect: (id: string | null) => void;
  docRef?: React.RefObject<HTMLDivElement>;
}

export function Doc({ text, marks, pane, selected, onSelect, docRef }: DocProps) {
  const segs = buildSegments(text, marks);
  const tone = new Map(marks.map((m) => [m.id, m.tone]));
  return (
    <div
      ref={docRef}
      className={`doc${selected ? " has-sel" : ""}`}
      data-pane={pane}
      tabIndex={0}
      aria-label={pane === "claim" ? "Draft claim text with highlights" : "Evidence text with highlights"}
    >
      {segs.map((s, i) => {
        if (!s.ids.length) return <Fragment key={i}>{s.text}</Fragment>; // plain text node: React escapes it, no HTML is built
        const isSel = selected !== null && s.ids.includes(selected);
        const primary = isSel ? (selected as string) : s.ids[0];
        return (
          <mark
            key={i}
            data-ids={s.ids.join(" ")}
            className={`${tone.get(primary) ?? "warn"}${isSel ? " sel" : ""}`}
            onClick={() => onSelect(isSel ? null : primary)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(isSel ? null : primary);
              }
            }}
            tabIndex={0}
            role="button"
            aria-pressed={isSel}
            title={isSel ? "Currently selected finding. Click or press Enter to clear." : "Click or press Enter to focus this finding"}
          >
            {s.text}
          </mark>
        );
      })}
    </div>
  );
}
