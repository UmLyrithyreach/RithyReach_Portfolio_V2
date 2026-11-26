// Drops a set of DOM elements (the intro's words and photo) with real rigid-body physics: each one
// becomes a box in a matter-js world (gravity, mass from its area, friction, a little bounce,
// collisions with each other) with a floor at the bottom of the stage and walls at its sides. The
// lowest line lets go first, so the lines above land on it, tumble and pile up. Every frame the
// bodies' positions and angles are written back to the elements as transforms; nothing is
// re-laid out. restore() eases everything back into place.
//
// matter-js is loaded on the first fall, so it costs nothing until then.

export interface FallItem {
  /** The element moved with a transform (an inline-block word, or a wrapper). */
  el: HTMLElement;
  /** Its current rotation in radians (the photo is tilted), so the body starts at the same angle. */
  angle?: number;
  /** Size of the body, if not the element's own box (the photo's frame inside its wrapper). */
  size?: { width: number; height: number };
}

export interface WordFall {
  /** Drop everything (no-op while already falling). */
  fall(): void;
  /** Ease everything back into place from wherever it lies: the fall played in reverse. */
  restore(): void;
  /** Drop the fall instantly: stop the simulation and put everything back in place, no animation. */
  reset(): void;
  destroy(): void;
}

const STEP = 1000 / 60;
const MAX_RUN_MS = 9000;

export function createWordFall(stage: HTMLElement, getItems: () => FallItem[]): WordFall {
  let state: "rest" | "falling" | "restoring" = "rest";
  let raf = 0;
  let timers: number[] = [];
  let items: FallItem[] = [];
  let generation = 0;

  const clearTimers = () => {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
  };

  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    clearTimers();
  };

  const fall = async () => {
    if (state === "falling") return;
    stop();
    state = "falling";
    const run = ++generation;
    const Matter = (await import("matter-js")).default;
    if (run !== generation || state !== "falling") return;
    const { Engine, Bodies, Body, Composite, Sleeping } = Matter;

    items = getItems();
    // Measure at rest: drop any transform (and transition) left from a restore in progress.
    for (const it of items) {
      it.el.style.transition = "none";
      it.el.style.transform = "";
    }
    const stageBox = stage.getBoundingClientRect();
    const W = stageBox.width;
    const H = stageBox.height;

    const engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.5;

    const wall = 200;
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, H + wall / 2, W * 3, wall, { isStatic: true, friction: 0.8 }),
      Bodies.rectangle(-wall / 2, H / 2, wall, H * 4, { isStatic: true }),
      Bodies.rectangle(W + wall / 2, H / 2, wall, H * 4, { isStatic: true }),
    ]);

    const bodies = items.map((it) => {
      const box = it.el.getBoundingClientRect();
      const cx = box.left - stageBox.left + box.width / 2;
      const cy = box.top - stageBox.top + box.height / 2;
      const w = it.size?.width ?? box.width;
      const h = it.size?.height ?? box.height;
      // Glyph boxes overlap their neighbours a little (line-height ~1.08); shrink the collision box
      // so the pieces don't start out jammed into each other and spring apart.
      const body = Bodies.rectangle(cx, cy, Math.max(4, w * 0.99), Math.max(4, h * 0.8), {
        angle: it.angle ?? 0,
        restitution: 0.18,
        friction: 0.55,
        frictionStatic: 0.9,
        frictionAir: 0.012,
        density: 0.0018,
        chamfer: { radius: Math.min(6, h * 0.08) },
      });
      it.el.style.willChange = "transform";
      return { body, cx, cy, angle0: it.angle ?? 0, top: box.top, live: false };
    });

    // Let go from the bottom line up, each piece with a tiny random nudge, so the stack collapses
    // instead of dropping as one block. A piece joins the world only when it lets go (one created
    // static and released later gets infinite mass in matter-js); until then it simply holds still.
    const lineTops = [...new Set(bodies.map((b) => Math.round(b.top / 8)))].sort((a, b) => b - a);
    bodies.forEach((b) => {
      const line = lineTops.indexOf(Math.round(b.top / 8));
      const delay = line * 110 + Math.random() * 140;
      timers.push(
        window.setTimeout(() => {
          if (run !== generation) return;
          Composite.add(engine.world, b.body);
          b.live = true;
          Sleeping.set(b.body, false);
          Body.setVelocity(b.body, { x: (Math.random() - 0.5) * 2.4, y: Math.random() * 0.8 });
          Body.setAngularVelocity(b.body, (Math.random() - 0.5) * 0.07);
        }, delay),
      );
    });

    const started = performance.now();
    let last = started;
    let acc = 0;
    const tick = (now: number) => {
      if (run !== generation) return;
      acc += Math.min(100, now - last);
      last = now;
      while (acc >= STEP) {
        Engine.update(engine, STEP);
        acc -= STEP;
      }
      bodies.forEach((b, i) => {
        if (!b.live) return;
        const { x, y } = b.body.position;
        items[i].el.style.transform =
          `translate3d(${(x - b.cx).toFixed(2)}px, ${(y - b.cy).toFixed(2)}px, 0) rotate(${(b.body.angle - b.angle0).toFixed(4)}rad)`;
      });
      const settled = now - started > 1500 && bodies.every((b) => b.live && b.body.isSleeping);
      if (settled || now - started > MAX_RUN_MS) {
        raf = 0;
        Engine.clear(engine);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const restore = () => {
    if (state !== "falling") return;
    generation++;
    stop();
    state = "restoring";
    const run = generation;
    for (const it of items) {
      it.el.style.transition = "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)";
      it.el.style.transform = "";
    }
    timers.push(
      window.setTimeout(() => {
        if (run !== generation) return;
        for (const it of items) {
          it.el.style.transition = "";
          it.el.style.willChange = "";
        }
        state = "rest";
      }, 950),
    );
  };

  const reset = () => {
    generation++;
    stop();
    for (const it of items) {
      it.el.style.transition = "";
      it.el.style.transform = "";
      it.el.style.willChange = "";
    }
    state = "rest";
  };

  return { fall: () => void fall(), restore, reset, destroy: reset };
}
