// The contact strip (portfolio.md §5, "The contact strip"): the old race calendar carrying the five
// contact channels instead of five rounds. Every value is in frame px, measured from the band's top;
// x runs across the 1440 frame and is spread about its middle by --cal-spread in CSS.

import { contactChannels, type ContactChannel } from "@/lib/data";

type Platform = ContactChannel["platform"];

/** Where a card sits and what marks it on the connector run, per the spec's table. */
interface StripPlace {
  platform: Platform;
  x: number;
  width: number;
  centre: number;
  marker: "pref" | "ring" | "preferred";
}

const PLACES: StripPlace[] = [
  { platform: "Email", x: 215, width: 230, centre: 330, marker: "pref" },
  { platform: "Discord", x: 490, width: 100, centre: 540, marker: "ring" },
  { platform: "Telegram", x: 650, width: 140, centre: 720, marker: "preferred" },
  { platform: "Facebook", x: 830, width: 140, centre: 900, marker: "ring" },
  { platform: "Instagram", x: 1020, width: 130, centre: 1085, marker: "ring" },
];

/** Below sm the strip keeps three cards, in this order. */
const PHONE_ORDER: Platform[] = ["Email", "Telegram", "Discord"];

export interface StripChannel extends StripPlace {
  descriptor: string;
  handle: string;
  href: string;
  /** The "live round": the filled accent dot, the pulse and the bracket. */
  preferred: boolean;
  /** Its place in the phone's three-up grid, or -1 when hidden there. */
  phoneOrder: number;
}

export const STRIP_CHANNELS: StripChannel[] = PLACES.flatMap((place) => {
  const channel = contactChannels.find((c) => c.platform === place.platform);
  if (!channel) return [];
  return [{
    ...place,
    descriptor: channel.description,
    handle: channel.handle,
    href: channel.url,
    preferred: place.marker === "preferred",
    phoneOrder: PHONE_ORDER.indexOf(place.platform),
  }];
});

export const STRIP = {
  /** Cards' top, the markers' top, the connectors' line. */
  cardY: 43,
  markY: 126,
  linkY: 131.5,
  dot: 11,
  /** Four dashed connectors, each from 19 past one card's centre to 19 short of the next. */
  links: [
    { x: 349, width: 172 },
    { x: 559, width: 142 },
    { x: 739, width: 142 },
    { x: 919, width: 147 },
  ],
  /** The accent bracket around the preferred card. */
  live: { left: 644, right: 796, top: 32, bottom: 113 },
  /** The preferred marker's pulse rings out every 3200ms (the dashes' 5200ms crawl is CSS). */
  pulseMs: 3200,
} as const;
