"use client";

// A timeline plate (portfolio.md §4): the project's screenshot in the stepped plate shape, clipped by
// the section's one `#works-plate-clip`, with the outline drawn over it. The whole plate is a link.

import Image from "next/image";
import { showAssetError } from "@/lib/engine";
import { PLATE_OUTLINE, PLATE_VIEW } from "@/lib/works/plate-shape";

/** The screenshots are 1600 wide; the plate crops them with object-fit, so the height is nominal. */
const SHOT = { width: 1600, height: 1000 } as const;

interface TimelinePlateProps {
  href: string;
  label: string;
  /** Id of the "(opens in a new tab)" note. */
  noteId: string;
  src: string;
  alt: string;
  sizes: string;
}

export default function TimelinePlate({ href, label, noteId, src, alt, sizes }: TimelinePlateProps) {
  return (
    <a className="works-plate" href={href} target="_blank" rel="noopener" aria-label={label} aria-describedby={noteId}>
      <span className="works-fill">
        <span className="works-slot">
          <Image
            src={src}
            alt={alt}
            width={SHOT.width}
            height={SHOT.height}
            sizes={sizes}
            data-works-img
            onError={() => showAssetError(src)}
          />
        </span>
      </span>
      <svg
        className="works-outline"
        viewBox={`0 0 ${PLATE_VIEW.width} ${PLATE_VIEW.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d={PLATE_OUTLINE} />
      </svg>
      <span className="vh" id={noteId}>(opens in a new tab)</span>
    </a>
  );
}
