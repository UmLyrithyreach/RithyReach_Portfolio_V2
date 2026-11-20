// One set of corner brackets: the design's single path, rotated four ways. The frame itself
// (--bl/--br/--bt/--bb, --bsz, the spread and stretch) is set in CSS on the set's class.

import { BRACKET_PATH } from "@/lib/about/geometry";

const CORNERS = ["tl", "tr", "br", "bl"] as const;

export default function Brackets({ className, dataKey }: { className: string; dataKey: string }) {
  return (
    <div className={`about-brackets ${className}`} data-about-brackets={dataKey} aria-hidden="true">
      {CORNERS.map((corner) => (
        <svg key={corner} className="about-bracket" data-corner={corner} viewBox="0 0 10.5 10.5" focusable="false">
          <path d={BRACKET_PATH} />
        </svg>
      ))}
    </div>
  );
}
