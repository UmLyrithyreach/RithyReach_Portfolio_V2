/**
 * 3D card ribbon for the hero.
 *
 * Eight cards laid end to end along one fixed rail that spirals through space — the video ribbon from
 * "Vante — Craft in Motion", with this portfolio's own work and stack cards as faces. The rail is a
 * centripetal Catmull-Rom curve through 161 control points, baked into 1201 arc-length-spaced points
 * and tangents. Each card is a plane of 28 x 3 cells bent vertex by vertex along that rail, so the
 * ribbon curls around the viewer: big cards close up, small ones far away.
 *
 * Plain WebGL2, no library. The camera is the spec's: a 35 degree lens looking down -Z, framed for
 * 16:9. The hero places that frame (centre + height) over the portrait with layout().
 *
 * The portrait is a flat DOM image, so depth against it is faked with its own alpha, sampled as a mask.
 * Cards nearer than the head's plane pass in front of it, the rest behind, so the ribbon threads
 * through the portrait instead of sitting on top of it. In front of the head a card turns to tinted
 * glass showing the colour portrait through it; everywhere else it is solid.
 *
 * Without WebGL2, create() returns null and the hero simply shows the portrait.
 */

type Vec3 = [number, number, number];

export type RibbonLayout = {
  /** Canvas size in CSS px. */
  width: number;
  height: number;
  /** Centre of the rail's 16:9 reference frame, in canvas CSS px. */
  centerX: number;
  centerY: number;
  /** Height of that reference frame in CSS px — this is what scales the ribbon. */
  viewHeight: number;
  /** The portrait's box in canvas CSS px (its alpha hides the cards that pass behind it). */
  figure: { x: number; y: number; w: number; h: number };
  /** The headline and buttons, in canvas CSS px: the ribbon fades out before it reaches them. */
  keep: { x0: number; y0: number; x1: number; y1: number } | null;
};

// --- Coil ---------------------------------------------------------------------------------------

const FOV = 35;
const TAN = Math.tan((FOV * Math.PI) / 360);

/**
 * The ribbon's path: one strand, two laps. It starts low on the left shoulder, crosses the front of
 * the neck, goes behind the neck, crosses the front of the face, goes behind the top of the head and
 * ends back on the left at the crown. Camera space: camera at the origin, looking down -Z; the head's
 * axis sits `depth` away and leans back by `tilt`, so the far side of each pass sits a little higher.
 */
const COIL = {
  depth: 12, // distance from the camera to the head's axis
  tilt: 0.18,
  from: -3.2, // height where the strand starts (left shoulder)...
  to: 3.0, // ...and where it ends (the top of the head, left)
  turns: 2,
  samples: 900,
};

/** Point on the strand at progress u (0 = shoulder, 1 = over the head), before the lean. */
function strand(u: number, out: Vec3) {
  // Start on the left (x = -r), cross the front of the neck, round the right, behind the head.
  const th = -Math.PI / 2 + u * COIL.turns * Math.PI * 2;
  // Wide over the shoulder, snug round the neck, a little wider round the head.
  const r = 3.4 + 1.2 * (1 - u) ** 3 + 0.4 * u;
  out[0] = r * Math.sin(th);
  // Climbs slowly round the neck, then faster up to the crown.
  out[1] = COIL.from + (COIL.to - COIL.from) * u ** 1.4;
  out[2] = r * Math.cos(th);
}

/** The strand baked at equal arc-length steps, leaned back and moved out to the head. */
const COIL_PATH = (() => {
  const n = COIL.samples;
  const pts: Vec3[] = [];
  const cum = [0];
  for (let i = 0; i <= n; i++) {
    const v: Vec3 = [0, 0, 0];
    strand(i / n, v);
    const c = Math.cos(COIL.tilt);
    const sn = Math.sin(COIL.tilt);
    pts.push([v[0], v[1] * c - v[2] * sn, v[1] * sn + v[2] * c - COIL.depth]);
    if (i > 0) {
      const a = pts[i - 1];
      const b = pts[i];
      cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    }
  }
  return { pts, cum, length: cum[n] };
})();
const COIL_LENGTH = COIL_PATH.length;

/** Position, unit tangent and the head's axis (the cards' upright) at arc length s along the strand. */
function coilAt(s: number, p: Vec3, t: Vec3, up: Vec3) {
  const { pts, cum } = COIL_PATH;
  const n = pts.length - 1;
  const x = Math.min(Math.max(s, 0), COIL_LENGTH);
  let lo = 0;
  let hi = n;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= x) lo = mid;
    else hi = mid;
  }
  const f = (x - cum[lo]) / (cum[hi] - cum[lo] || 1);
  const a = pts[lo];
  const b = pts[hi];
  for (let k = 0; k < 3; k++) {
    p[k] = a[k] + (b[k] - a[k]) * f;
    t[k] = b[k] - a[k];
  }
  const len = Math.hypot(t[0], t[1], t[2]) || 1;
  t[0] /= len;
  t[1] /= len;
  t[2] /= len;
  up[0] = 0;
  up[1] = Math.cos(COIL.tilt);
  up[2] = Math.sin(COIL.tilt);
}

// --- Cards ----------------------------------------------------------------------------------------

const FACE_COUNT = 8;
// Enough cards to fill the strand end to end with a slim gap: faces repeat.
const CARD_COUNT = 22;
const CARD_W = 2.1;
const CARD_H = 1.32;
const STEP = COIL_LENGTH / CARD_COUNT; // card width plus an even gap all the way round
const CELLS_U = 28; // PlaneGeometry(1, 1, 28, 3)
const CELLS_V = 3;
// The plane is grown below the card so the shader can draw a soft shadow out there.
const PAD_BOTTOM = 0.22;
const COLS = CELLS_U + 1;
const ROWS = CELLS_V + 1;
const VERTS = COLS * ROWS;
const TRIS_INDICES = (COLS - 1) * (ROWS - 1) * 6;

// --- Shaders --------------------------------------------------------------------------------------

const VERT = `#version 300 es
in vec3 aPos;
in vec2 aUv;
uniform vec2 uScale;
uniform vec2 uOffset;
uniform vec2 uRoll;
out vec2 vUv;
out float vDepth;
void main() {
  float w = -aPos.z;
  vec2 xy = vec2(uRoll.x * aPos.x - uRoll.y * aPos.y, uRoll.y * aPos.x + uRoll.x * aPos.y);
  gl_Position = vec4(xy * uScale + uOffset * w, 0.0, w);
  vUv = aUv;
  vDepth = w;
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
in float vDepth;
out vec4 outColor;
uniform sampler2D uFace;
uniform sampler2D uMask;
uniform sampler2D uColour;
uniform float uHasColour;
uniform vec4 uFig;
uniform vec4 uKeep;
uniform vec2 uCanvas;
uniform float uKeepSoft;
uniform float uHeadDepth;
uniform float uHasMask;
uniform float uAlpha;
uniform float uCard;

const float ASPECT = 2.1 / 1.32;
const float RADIUS = 0.018;
const vec3 INK = vec3(0.078, 0.078, 0.074);

float roundedBox(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 uv = vUv;

  vec2 p = (uv - 0.5) * vec2(ASPECT, 1.0);
  float d = roundedBox(p, vec2(ASPECT, 1.0) * 0.5, RADIUS);
  float px = fwidth(d);
  float cover = 1.0 - smoothstep(-px, px, d);
  float rim = smoothstep(-0.012 - px, -0.012, d);

  vec3 face = texture(uFace, uv).rgb;
  // Seen from behind, a card shows its plain back.
  if (!gl_FrontFacing) face = vec3(0.9, 0.89, 0.86);
  face = mix(face, INK, 0.16 * rim);

  // Soft contact shadow below the card, narrower than it, so neighbours never shade each other.
  float ds = roundedBox(p - vec2(0.0, 0.07), vec2(ASPECT * 0.5 - 0.17, 0.5), 0.05);
  float shadow = (1.0 - smoothstep(-0.02, 0.16, ds)) * 0.24 * (1.0 - cover);

  // The portrait hides what is behind it.
  vec2 frag = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y);
  vec2 fuv = (frag - uFig.xy) / uFig.zw;
  float solid = 0.0;
  if (uHasMask > 0.5 && fuv.x >= 0.0 && fuv.x <= 1.0 && fuv.y >= 0.0 && fuv.y <= 1.0) {
    solid = textureLod(uMask, fuv, 0.0).a;
  }
  float behind = smoothstep(uHeadDepth - 0.35, uHeadDepth + 0.35, vDepth);
  float hidden = solid * behind;
  // In front of the head the card turns to glass and shows the portrait in colour through it.
  float front = solid * (1.0 - behind);
  vec3 colour = face;
  if (uHasColour > 0.5 && front > 0.0) colour = textureLod(uColour, clamp(fuv, 0.0, 1.0), 0.0).rgb;
  float glass = 0.75 * front * uHasColour;

  // Keep clear of the headline and buttons.
  vec2 kq = abs(frag - (uKeep.xy + uKeep.zw) * 0.5) - (uKeep.zw - uKeep.xy) * 0.5;
  float away = smoothstep(0.0, uKeepSoft, length(max(kq, 0.0)) + min(max(kq.x, kq.y), 0.0));

  float visible = (1.0 - hidden) * away * uAlpha * uCard;
  shadow *= 1.0 - front;
  float a = (cover + shadow) * visible;
  outColor = vec4((mix(face, colour, glass) * cover + INK * shadow) * visible, a);
}`;

// --- Renderer -------------------------------------------------------------------------------------

/** How the ribbon sits and moves. */
const LOOK = {
  // Arc length per second the cards travel along the strand (left to right across the front).
  speed: 0.6,
  // Arc length over which a card fades in at the start of the strand and out at its end, so the
  // strand has no hard ends and seems to run on forever.
  fade: 5,
  // Camera roll in radians: tips the whole loop onto a diagonal.
  roll: 0.22,
  // Cards nearer than this (camera-space depth) pass in front of the portrait, farther ones behind it.
  headDepth: COIL.depth,
};

const FADE_IN_SECONDS = 0.9;
/** How far (px) the ribbon fades out before it reaches the headline and buttons. */
const KEEP_CLEAR_SOFTNESS = 56;

export class HeroRibbon {
  private readonly gl: WebGL2RenderingContext;
  private readonly prog: WebGLProgram;
  private readonly u: Record<string, WebGLUniformLocation | null> = {};
  private readonly vao: WebGLVertexArrayObject;
  private readonly posBuf: WebGLBuffer;
  private readonly uvBuf: WebGLBuffer;
  private readonly idxBuf: WebGLBuffer;
  private readonly faces: WebGLTexture[] = [];
  private readonly mask: WebGLTexture | null;
  private readonly colour: WebGLTexture | null;
  private readonly positions = new Float32Array(CARD_COUNT * VERTS * 3);

  private layoutBox: RibbonLayout | null = null;
  private dpr = 1;
  private clock = 0;
  private alpha: number;

  // Scratch vectors, so a frame allocates nothing.
  private readonly P: Vec3 = [0, 0, 0];
  private readonly T: Vec3 = [0, 0, 0];
  private readonly U: Vec3 = [0, 0, 0];
  private readonly cardAlpha = new Float64Array(CARD_COUNT);
  private readonly order = Array.from({ length: CARD_COUNT }, (_, i) => i);
  private readonly depths = new Float64Array(CARD_COUNT);

  /** Returns null where WebGL2 is unavailable. `faces` are FACE_COUNT card images; `portrait` is the cut-out. */
  static create(
    canvas: HTMLCanvasElement,
    faces: TexImageSource[],
    portrait: TexImageSource | null,
    colour: TexImageSource | null,
    opts: { fadeIn: boolean },
  ): HeroRibbon | null {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl || faces.length < FACE_COUNT) return null;
    try {
      return new HeroRibbon(canvas, gl, faces, portrait, colour, opts.fadeIn);
    } catch {
      return null;
    }
  }

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    faces: TexImageSource[],
    portrait: TexImageSource | null,
    colour: TexImageSource | null,
    fadeIn: boolean,
  ) {
    this.gl = gl;
    this.alpha = fadeIn ? 0 : 1;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.bindAttribLocation(prog, 1, "aUv");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    this.prog = prog;
    const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(prog, i)!.name;
      this.u[name] = gl.getUniformLocation(prog, name);
    }

    // Static texture coordinates (v runs top -> bottom) and triangle indices, one block per card.
    const uvs = new Float32Array(CARD_COUNT * VERTS * 2);
    const indices = new Uint16Array(CARD_COUNT * TRIS_INDICES);
    for (let k = 0; k < CARD_COUNT; k++) {
      for (let ix = 0; ix < COLS; ix++) {
        for (let iy = 0; iy < ROWS; iy++) {
          const o = (k * VERTS + ix * ROWS + iy) * 2;
          uvs[o] = ix / (COLS - 1);
          uvs[o + 1] = (iy / (ROWS - 1)) * (1 + PAD_BOTTOM);
        }
      }
      let n = k * TRIS_INDICES;
      for (let ix = 0; ix < COLS - 1; ix++) {
        for (let iy = 0; iy < ROWS - 1; iy++) {
          const a = k * VERTS + ix * ROWS + iy; // top left
          const b = a + ROWS; // top right
          const c = a + 1; // bottom left
          const d = b + 1; // bottom right
          indices[n++] = a;
          indices[n++] = c;
          indices[n++] = d;
          indices[n++] = a;
          indices[n++] = d;
          indices[n++] = b;
        }
      }
    }

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    this.posBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    this.uvBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    this.idxBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    for (let k = 0; k < FACE_COUNT; k++) {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, faces[k]);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (aniso) {
        const max = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
        gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
      }
      this.faces.push(tex);
    }

    const image = (src: TexImageSource | null) => {
      if (!src) return null;
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    };
    this.mask = image(portrait);
    this.colour = image(colour);
  }

  /** Where the rail's frame sits on the canvas. Call whenever the hero or the portrait changes size. */
  layout(l: RibbonLayout) {
    this.layoutBox = l;
    // The canvas covers the whole hero; cap the backing store so a 4K screen does not render 8M pixels.
    this.dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4_200_000 / Math.max(1, l.width * l.height)));
    this.canvas.width = Math.max(1, Math.round(l.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(l.height * this.dpr));
  }

  /** Bend card k round the coil, centred at arc length `centre`, writing its vertices into `positions`. */
  private pose(k: number, centre: number) {
    const { P, T, U, positions } = this;
    let o = k * VERTS * 3;
    for (let ix = 0; ix < COLS; ix++) {
      const lu = ix / (COLS - 1) - 0.5;
      coilAt(centre + lu * CARD_W, P, T, U);
      // Upright: the coil axis with its component along the path taken out.
      const d = U[0] * T[0] + U[1] * T[1] + U[2] * T[2];
      let ux = U[0] - T[0] * d;
      let uy = U[1] - T[1] * d;
      let uz = U[2] - T[2] * d;
      const len = Math.hypot(ux, uy, uz) || 1;
      ux /= len;
      uy /= len;
      uz /= len;
      for (let iy = 0; iy < ROWS; iy++) {
        const lv = (0.5 - (iy / (ROWS - 1)) * (1 + PAD_BOTTOM)) * CARD_H;
        positions[o++] = P[0] + ux * lv;
        positions[o++] = P[1] + uy * lv;
        positions[o++] = P[2] + uz * lv;
      }
    }
  }

  /**
   * Advance the ribbon by `dt` seconds (when `advance`) and draw it. `visible` lets the caller skip the
   * draw while the hero is off screen; the clock still counts so the ribbon does not jump back.
   */
  frame(dt: number, advance: boolean, visible = true) {
    const gl = this.gl;
    const l = this.layoutBox;
    if (!l || gl.isContextLost()) return;
    if (advance) this.clock += dt;
    if (this.alpha < 1) this.alpha = Math.min(1, this.alpha + dt / FADE_IN_SECONDS);
    if (!visible) return;

    // The cards travel the strand endlessly: each fades in at the shoulder, rides round, fades out
    // at the crown and comes back in at the shoulder.
    const flow = this.clock * LOOK.speed;
    for (let k = 0; k < CARD_COUNT; k++) {
      const c = (((k * STEP + flow) % COIL_LENGTH) + COIL_LENGTH) % COIL_LENGTH;
      this.pose(k, c);
      coilAt(c, this.P, this.T, this.U);
      this.depths[k] = -this.P[2];
      const f = Math.min(Math.max(Math.min(c, COIL_LENGTH - c) / LOOK.fade, 0), 1);
      this.cardAlpha[k] = f * f * (3 - 2 * f);
    }
    this.order.sort((a, b) => this.depths[b] - this.depths[a]);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.positions);

    const u = this.u;
    gl.uniform2f(u.uScale, l.viewHeight / (TAN * l.width), l.viewHeight / (TAN * l.height));
    gl.uniform2f(u.uOffset, (2 * l.centerX) / l.width - 1, 1 - (2 * l.centerY) / l.height);
    gl.uniform2f(u.uRoll, Math.cos(LOOK.roll), Math.sin(LOOK.roll));
    gl.uniform4f(
      u.uFig,
      l.figure.x * this.dpr,
      l.figure.y * this.dpr,
      l.figure.w * this.dpr,
      l.figure.h * this.dpr,
    );
    const keep = l.keep;
    if (keep) {
      gl.uniform4f(u.uKeep, keep.x0 * this.dpr, keep.y0 * this.dpr, keep.x1 * this.dpr, keep.y1 * this.dpr);
    } else {
      gl.uniform4f(u.uKeep, -1e5, -1e5, -1e5 + 1, -1e5 + 1);
    }
    gl.uniform1f(u.uKeepSoft, KEEP_CLEAR_SOFTNESS * this.dpr);
    gl.uniform2f(u.uCanvas, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uHeadDepth, LOOK.headDepth);
    gl.uniform1f(u.uHasMask, this.mask ? 1 : 0);
    gl.uniform1f(u.uAlpha, this.alpha);
    gl.uniform1i(u.uFace, 0);
    gl.uniform1i(u.uMask, 1);
    gl.uniform1i(u.uColour, 2);
    gl.uniform1f(u.uHasColour, this.colour ? 1 : 0);

    if (this.colour) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.colour);
    }
    if (this.mask) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.mask);
    }
    gl.activeTexture(gl.TEXTURE0);
    for (const k of this.order) {
      if (this.cardAlpha[k] <= 0) continue;
      gl.uniform1f(u.uCard, this.cardAlpha[k]);
      gl.bindTexture(gl.TEXTURE_2D, this.faces[k % FACE_COUNT]);
      gl.drawElements(gl.TRIANGLES, TRIS_INDICES, gl.UNSIGNED_SHORT, k * TRIS_INDICES * 2);
    }
  }

  destroy() {
    const gl = this.gl;
    for (const t of this.faces) gl.deleteTexture(t);
    if (this.mask) gl.deleteTexture(this.mask);
    if (this.colour) gl.deleteTexture(this.colour);
    gl.deleteBuffer(this.posBuf);
    gl.deleteBuffer(this.uvBuf);
    gl.deleteBuffer(this.idxBuf);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.prog);
  }
}
