/**
 * Watery cursor reveal for the hero.
 *
 * A small GPU fluid simulation (stable fluids: advection, vorticity confinement, pressure
 * projection) runs over the whole hero. The cursor stirs the velocity field and pours "dye" into
 * it; the dye swirls, curls and slowly dissipates. The dye is the reveal mask: inside the portrait
 * it shows the colour photograph, refracted by the moving liquid; elsewhere a faint ink tint.
 * A resting cursor lets the liquid settle and fade back to the black-and-white portrait.
 *
 * WebGL2 with renderable half-float textures is required; without it create() returns null and
 * the hero simply keeps its black-and-white portrait.
 */

const SIM_RES = 80; // velocity / pressure grid, short side
const DYE_RES = 256; // dye (mask) grid, short side — upscaled smoothly, edges stay soft
const PRESSURE_ITERATIONS = 8;
const CURL = 28; // vorticity confinement: how much the liquid swirls
const VELOCITY_DISSIPATION = 0.9;
const DYE_DISSIPATION = 0.45; // how fast the reveal fades once the cursor rests
const PRESSURE_DISSIPATION = 0.8;
const SPLAT_FORCE = 5200;
const SPLAT_RADIUS = 0.0021; // in uv² of the short side
const SPLAT_DYE = 1.1;
const IDLE_MS = 3500; // stop simulating this long after the last stir

const VERT = `#version 300 es
in vec2 aPos;
uniform vec2 texelSize;
out vec2 vUv, vL, vR, vT, vB;
void main() {
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const HEADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 outColor;
`;

const SPLAT = `${HEADER}
uniform sampler2D uTarget;
uniform float aspect;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point;
  p.x *= aspect;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  outColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`;

const ADVECT = `${HEADER}
uniform sampler2D uVelocity, uSource;
uniform vec2 velTexel;
uniform float dt, dissipation, maxValue;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * velTexel;
  vec4 r = texture(uSource, coord) / (1.0 + dissipation * dt);
  outColor = min(r, vec4(maxValue));
}`;

const DIVERGENCE = `${HEADER}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const CURL_FS = `${HEADER}
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  outColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const VORTICITY = `${HEADER}
uniform sampler2D uVelocity, uCurl;
uniform float curl, dt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy + force * dt;
  outColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
}`;

const PRESSURE = `${HEADER}
uniform sampler2D uPressure, uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float div = texture(uDivergence, vUv).x;
  outColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT = `${HEADER}
uniform sampler2D uPressure, uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 vel = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  outColor = vec4(vel, 0.0, 1.0);
}`;

const SCALE = `${HEADER}
uniform sampler2D uTexture;
uniform float value;
void main() { outColor = value * texture(uTexture, vUv); }`;

/* The dye is the mask. Its gradient bends the photo like a lens and the velocity drags it,
   so the colour portrait wobbles through the liquid; a faint rim catches light at the edge. */
const DISPLAY = `${HEADER}
uniform sampler2D uDye, uVelocity, uImage;
uniform float hasImage;
uniform vec4 fig;      // portrait box in canvas uv, y down: x, y, w, h
uniform vec4 tint;     // backdrop liquid rgb + alpha
uniform vec2 dyeTexel;
void main() {
  float d = texture(uDye, vUv).r;
  // Colour shows wherever there is liquid and is full strength by moderate density, so your
  // face clearly turns colour under the cursor; the grey film (below) stays in the dense core.
  float mask = smoothstep(0.012, 0.11, d);
  if (mask <= 0.001) { outColor = vec4(0.0); return; }

  float dL = texture(uDye, vUv - vec2(dyeTexel.x, 0.0)).r;
  float dR = texture(uDye, vUv + vec2(dyeTexel.x, 0.0)).r;
  float dT = texture(uDye, vUv + vec2(0.0, dyeTexel.y)).r;
  float dB = texture(uDye, vUv - vec2(0.0, dyeTexel.y)).r;
  vec2 grad = vec2(dR - dL, dT - dB);
  vec2 vel = texture(uVelocity, vUv).xy;

  // Refraction: lens from the liquid surface + drag from the flow (uv, y up).
  vec2 offset = grad * 0.035 + clamp(vel * 0.000035, vec2(-0.02), vec2(0.02));
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y) - vec2(offset.x, -offset.y);
  vec2 iuv = (uv - fig.xy) / fig.zw;
  float inside = step(0.0, iuv.x) * step(iuv.x, 1.0) * step(0.0, iuv.y) * step(iuv.y, 1.0);
  vec4 img = texture(uImage, clamp(iuv, 0.0, 1.0));
  float a = img.a * inside * hasImage;

  // Off the portrait the liquid is only a faint ink film, and only where it is dense.
  float film = tint.a * smoothstep(0.12, 0.45, d);
  // A thin highlight along the steepest part of the surface, on the portrait only.
  float rim = clamp(length(grad) * 5.0, 0.0, 1.0) * (1.0 - smoothstep(0.2, 0.5, d)) * 0.07 * a;

  vec3 col = (img.rgb * a) * mask + tint.rgb * film * (1.0 - a) + vec3(rim);
  float alpha = a * mask + film * (1.0 - a) + rim;
  outColor = vec4(col, clamp(alpha, 0.0, 1.0));
}`;

type Program = { prog: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
type FBO = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number; texel: [number, number] };
type DoubleFBO = { read: FBO; write: FBO; swap(): void; w: number; h: number; texel: [number, number] };

export interface FluidRevealOptions {
  /** The colour photograph, framed exactly like the black-and-white cut-out it sits on. */
  imageSrc: string;
  /** Backdrop liquid colour, 0..1 rgb. */
  tint: [number, number, number];
  tintAlpha: number;
}

export class FluidReveal {
  private gl: WebGL2RenderingContext;
  private p: Record<string, Program> = {};
  private velocity!: DoubleFBO;
  private dye!: DoubleFBO;
  private pressure!: DoubleFBO;
  private divergence!: FBO;
  private curl!: FBO;
  private image: WebGLTexture | null = null;
  private hasImage = false;

  private dpr = 1;
  private cssW = 1;
  private cssH = 1;
  private fig = { x: 0, y: 0, w: 1, h: 1 };
  private last: { x: number; y: number } | null = null;
  private splats: { x: number; y: number; dx: number; dy: number }[] = [];
  private lastStir = -Infinity;
  private lastTime = 0;
  private cleared = true;

  /** Returns null where WebGL2 / half-float rendering is unavailable. */
  static create(canvas: HTMLCanvasElement, opts: FluidRevealOptions): FluidReveal | null {
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;
    try {
      return new FluidReveal(canvas, gl, opts);
    } catch {
      return null;
    }
  }

  private constructor(private canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, private opts: FluidRevealOptions) {
    this.gl = gl;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND);

    const sources: Record<string, string> = {
      splat: SPLAT,
      advect: ADVECT,
      divergence: DIVERGENCE,
      curl: CURL_FS,
      vorticity: VORTICITY,
      pressure: PRESSURE,
      gradient: GRADIENT,
      scale: SCALE,
      display: DISPLAY,
    };
    for (const [name, fs] of Object.entries(sources)) this.p[name] = this.program(fs);
    this.allocate(1, 1);
    this.loadImage(opts.imageSrc);
  }

  private program(fs: string): Program {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    const u: Record<string, WebGLUniformLocation | null> = {};
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const name = gl.getActiveUniform(prog, i)!.name;
      u[name] = gl.getUniformLocation(prog, name);
    }
    return { prog, u };
  }

  private fbo(w: number, h: number, internal: number, format: number): FBO {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("fbo");
    return { tex, fbo, w, h, texel: [1 / w, 1 / h] };
  }

  private double(w: number, h: number, internal: number, format: number): DoubleFBO {
    let a = this.fbo(w, h, internal, format);
    let b = this.fbo(w, h, internal, format);
    return {
      get read() { return a; },
      get write() { return b; },
      swap() { [a, b] = [b, a]; },
      w,
      h,
      texel: [1 / w, 1 / h],
    };
  }

  private freeAll() {
    const gl = this.gl;
    const free = (f?: FBO) => {
      if (!f) return;
      gl.deleteTexture(f.tex);
      gl.deleteFramebuffer(f.fbo);
    };
    for (const d of [this.velocity, this.dye, this.pressure]) {
      if (!d) continue;
      free(d.read);
      free(d.write);
    }
    free(this.divergence);
    free(this.curl);
  }

  private allocate(w: number, h: number) {
    const gl = this.gl;
    this.freeAll();
    const res = (base: number) => {
      const aspect = w / h;
      return aspect >= 1
        ? { w: Math.round(base * aspect), h: base }
        : { w: base, h: Math.round(base / aspect) };
    };
    const sim = res(SIM_RES);
    const dye = res(DYE_RES);
    this.velocity = this.double(sim.w, sim.h, gl.RG16F, gl.RG);
    this.pressure = this.double(sim.w, sim.h, gl.R16F, gl.RED);
    this.divergence = this.fbo(sim.w, sim.h, gl.R16F, gl.RED);
    this.curl = this.fbo(sim.w, sim.h, gl.R16F, gl.RED);
    this.dye = this.double(dye.w, dye.h, gl.R16F, gl.RED);
  }

  private loadImage(src: string) {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const gl = this.gl;
      this.image = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.image);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.hasImage = true;
      this.canvas.dataset.colour = "loaded";
    };
    // A missing colour file leaves the liquid as a tint only.
    img.onerror = () => {
      this.hasImage = false;
      this.canvas.dataset.colour = "error";
    };
    img.src = src;
  }

  get colourLoaded() {
    return this.hasImage;
  }

  /** Size the canvas (css px) and place the portrait inside it (`fig`, css px relative to the canvas). */
  resize(width: number, height: number, fig: { x: number; y: number; w: number; h: number }) {
    // 1× is enough for a soft liquid layer; HiDPI would multiply the full-screen pass.
    this.dpr = Math.min(window.devicePixelRatio || 1, 1);
    const sizeChanged = Math.round(width) !== Math.round(this.cssW) || Math.round(height) !== Math.round(this.cssH);
    this.cssW = Math.max(1, width);
    this.cssH = Math.max(1, height);
    this.fig = fig;
    this.canvas.width = Math.max(1, Math.round(this.cssW * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.cssH * this.dpr));
    if (sizeChanged) this.allocate(this.cssW, this.cssH);
    this.cleared = false;
  }

  /** Pointer position relative to the canvas, css px. */
  setPointer(x: number, y: number) {
    const prev = this.last;
    this.last = { x, y };
    if (!prev) return;
    const dx = x - prev.x;
    const dy = y - prev.y;
    // A jump (cursor re-entering the window) is not a stroke.
    if (Math.hypot(dx, dy) > this.cssH * 0.25 || (dx === 0 && dy === 0)) return;
    this.splats.push({ x, y, dx, dy });
    this.lastStir = performance.now();
  }

  private blit(target: FBO | null) {
    const gl = this.gl;
    if (target) {
      gl.viewport(0, 0, target.w, target.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    } else {
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private use(name: string, texel: [number, number]) {
    const gl = this.gl;
    const pr = this.p[name];
    gl.useProgram(pr.prog);
    gl.uniform2f(pr.u.texelSize, texel[0], texel[1]);
    return pr.u;
  }

  private bindTex(unit: number, tex: WebGLTexture, loc: WebGLUniformLocation | null) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
  }

  private splat(s: { x: number; y: number; dx: number; dy: number }) {
    const gl = this.gl;
    const aspect = this.cssW / this.cssH;
    const point: [number, number] = [s.x / this.cssW, 1 - s.y / this.cssH];
    const radius = SPLAT_RADIUS * (aspect > 1 ? aspect : 1);

    let u = this.use("splat", this.velocity.texel);
    this.bindTex(0, this.velocity.read.tex, u.uTarget);
    gl.uniform1f(u.aspect, aspect);
    gl.uniform2f(u.point, point[0], point[1]);
    gl.uniform3f(u.color, (s.dx / this.cssW) * SPLAT_FORCE, (-s.dy / this.cssH) * SPLAT_FORCE, 0);
    gl.uniform1f(u.radius, radius);
    this.blit(this.velocity.write);
    this.velocity.swap();

    // More dye for faster strokes, so a flick pours more liquid than a crawl.
    const speed = Math.min(1, Math.hypot(s.dx, s.dy) / (this.cssH * 0.02));
    u = this.use("splat", this.dye.texel);
    this.bindTex(0, this.dye.read.tex, u.uTarget);
    gl.uniform1f(u.aspect, aspect);
    gl.uniform2f(u.point, point[0], point[1]);
    gl.uniform3f(u.color, SPLAT_DYE * (0.35 + 0.65 * speed), 0, 0);
    gl.uniform1f(u.radius, radius * 1.15);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  private step(dt: number) {
    const gl = this.gl;
    const v = this.velocity;

    let u = this.use("curl", v.texel);
    this.bindTex(0, v.read.tex, u.uVelocity);
    this.blit(this.curl);

    u = this.use("vorticity", v.texel);
    this.bindTex(0, v.read.tex, u.uVelocity);
    this.bindTex(1, this.curl.tex, u.uCurl);
    gl.uniform1f(u.curl, CURL);
    gl.uniform1f(u.dt, dt);
    this.blit(v.write);
    v.swap();

    u = this.use("divergence", v.texel);
    this.bindTex(0, v.read.tex, u.uVelocity);
    this.blit(this.divergence);

    u = this.use("scale", this.pressure.texel);
    this.bindTex(0, this.pressure.read.tex, u.uTexture);
    gl.uniform1f(u.value, PRESSURE_DISSIPATION);
    this.blit(this.pressure.write);
    this.pressure.swap();

    u = this.use("pressure", v.texel);
    this.bindTex(1, this.divergence.tex, u.uDivergence);
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      this.bindTex(0, this.pressure.read.tex, u.uPressure);
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    u = this.use("gradient", v.texel);
    this.bindTex(0, this.pressure.read.tex, u.uPressure);
    this.bindTex(1, v.read.tex, u.uVelocity);
    this.blit(v.write);
    v.swap();

    u = this.use("advect", v.texel);
    gl.uniform2f(u.velTexel, v.texel[0], v.texel[1]);
    this.bindTex(0, v.read.tex, u.uVelocity);
    this.bindTex(1, v.read.tex, u.uSource);
    gl.uniform1f(u.dt, dt);
    gl.uniform1f(u.dissipation, VELOCITY_DISSIPATION);
    gl.uniform1f(u.maxValue, 1000);
    this.blit(v.write);
    v.swap();

    u = this.use("advect", this.dye.texel);
    gl.uniform2f(u.velTexel, v.texel[0], v.texel[1]);
    this.bindTex(0, v.read.tex, u.uVelocity);
    this.bindTex(1, this.dye.read.tex, u.uSource);
    gl.uniform1f(u.dt, dt);
    gl.uniform1f(u.dissipation, DYE_DISSIPATION);
    gl.uniform1f(u.maxValue, 1.2);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  private display() {
    const gl = this.gl;
    const u = this.use("display", this.dye.texel);
    this.bindTex(0, this.dye.read.tex, u.uDye);
    this.bindTex(1, this.velocity.read.tex, u.uVelocity);
    if (this.image) this.bindTex(2, this.image, u.uImage);
    gl.uniform1f(u.hasImage, this.hasImage ? 1 : 0);
    gl.uniform2f(u.dyeTexel, this.dye.texel[0], this.dye.texel[1]);
    gl.uniform4f(u.fig, this.fig.x / this.cssW, this.fig.y / this.cssH, this.fig.w / this.cssW, this.fig.h / this.cssH);
    gl.uniform4f(u.tint, this.opts.tint[0], this.opts.tint[1], this.opts.tint[2], this.opts.tintAlpha);
    this.blit(null);
  }

  frame(now: number) {
    const dt = Math.min(1 / 60, Math.max(0, (now - this.lastTime) / 1000) || 1 / 60);
    this.lastTime = now;
    const gl = this.gl;

    // Long after the last stir the liquid has faded: stop paying for it.
    if (now - this.lastStir > IDLE_MS && this.splats.length === 0) {
      if (!this.cleared) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.cleared = true;
      }
      return;
    }
    this.cleared = false;

    for (const s of this.splats) this.splat(s);
    this.splats.length = 0;
    this.step(dt);
    this.display();
  }

  destroy() {
    const gl = this.gl;
    this.freeAll();
    if (this.image) gl.deleteTexture(this.image);
    for (const pr of Object.values(this.p)) gl.deleteProgram(pr.prog);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
