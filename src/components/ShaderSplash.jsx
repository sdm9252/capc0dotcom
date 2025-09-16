import { useEffect, useRef } from 'react'

function hashStringToUnitVec3(str) {
  // Simple string hash → 3 floats in [0,1)
  let h1 = 2166136261, h2 = 2246822519, h3 = 3266489917
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h1 ^= c; h1 = Math.imul(h1, 16777619)
    h2 ^= c; h2 = Math.imul(h2, 2246822519)
    h3 ^= c; h3 = Math.imul(h3, 3266489917)
  }
  const toUnit = (x) => ((x >>> 0) % 1000) / 999 // stable-ish 0..1
  return [toUnit(h1), toUnit(h2), toUnit(h3)]
}

const VERT_SRC = `#version 300 es
layout(location=0) in vec2 a_pos;
void main(){
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FRAG_SRC = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uSeed;
uniform sampler2D iText;        // RGBA text mask
uniform vec2 iTextResolution;   // size of text texture

// Palette helper by Iñigo Quílez: https://iquilezles.org/articles/palettes/
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

mat2 rot(float a){
  float s = sin(a), c = cos(a);
  return mat2(c,-s,s,c);
}

float sdCircle(vec2 p, float r){
  return length(p) - r;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag / iResolution.xy) * 2.0 - 1.0;
  uv.x *= iResolution.x / iResolution.y;

  // Seed influences orientation, warp, palette
  float seed = dot(uSeed, vec3(0.35, 0.44, 0.21));
  float ang = mix(-3.14159, 3.14159, fract(seed));
  vec2 p = uv * rot(ang);

  // Domain warp
  float t = iTime * 0.25;
  vec2 q = p;
  q += 0.25 * vec2(
    sin(3.0*p.y + t*1.3 + uSeed.x*6.28),
    cos(3.0*p.x - t*1.7 + uSeed.y*6.28)
  );
  vec2 r = p;
  r += 0.35 * vec2(
    sin(2.0*q.y + t*1.1 + uSeed.z*6.28),
    cos(2.0*q.x - t*1.9 + uSeed.x*6.28)
  );

  // Layered circles distance field
  float d1 = sdCircle(r, 0.6 + 0.2*sin(t + uSeed.x*10.0));
  float d2 = sdCircle(r*rot(2.0+uSeed.y*3.0), 0.35);
  float d3 = sdCircle(r*rot(-1.0+uSeed.z*2.0), 0.15 + 0.1*sin(1.5*t));

  float d = min(d1, min(d2, d3));

  // Sample text mask (alpha) in screen space
  vec2 texUV = frag / iTextResolution;
  float m = texture(iText, texUV).a; // 0..1

  // Approximate edge by sampling neighbors (screen-space)
  vec2 px = 1.0 / iTextResolution;
  float mR = texture(iText, texUV + vec2(px.x, 0.0)).a;
  float mL = texture(iText, texUV - vec2(px.x, 0.0)).a;
  float mU = texture(iText, texUV + vec2(0.0, px.y)).a;
  float mD = texture(iText, texUV - vec2(0.0, px.y)).a;
  float edge = clamp((abs(mR-mL) + abs(mU-mD))*0.5, 0.0, 1.0);

  // Use text mask to modulate warp
  r += 0.12*m*vec2(
    sin(10.0*r.y + t*4.0 + uSeed.x*4.0),
    cos(10.0*r.x - t*3.7 + uSeed.y*4.0)
  );

  // Soft bands using distance
  float v = 0.0;
  v += 0.5 + 0.5 * cos(8.0*d - t*3.0);
  v *= smoothstep(1.2, 0.0, length(uv)); // vignette

  // Seeded palette
  vec3 a = vec3(0.52, 0.50, 0.48) * (0.8 + 0.2*uSeed.x);
  vec3 b = vec3(0.40, 0.30, 0.60) * (0.7 + 0.3*uSeed.y);
  vec3 c = vec3(0.60, 0.80, 0.40) * (0.6 + 0.4*uSeed.z);
  vec3 dcol = vec3(0.20, 0.25, 0.30) + 0.25*uSeed;
  vec3 col = palette(v + d, a, b, c, dcol);

  // Blend in text: inside letters, shift palette and add glow
  float glow = smoothstep(0.0, 0.6, m) * (0.55 + 0.45*sin(t*3.0 + uSeed.z*6.28));
  vec3 textCol = palette(v + d + 0.2, a.yzx, b.zxy, c.xyz, dcol.zyx);
  col = mix(col, textCol, m*0.85);
  col += glow*0.25;
  // Outline highlights
  col += edge * vec3(0.6, 0.7, 1.0) * 0.35;

  // Subtle scanlines for texture
  col *= 0.98 + 0.02*cos(gl_FragCoord.y*2.0);

  fragColor = vec4(col, 1.0);
}`

export default function ShaderSplash({ seedStr = 'CapC0' }) {
  const canvasRef = useRef(null)
  const glRef = useRef(null)
  const programRef = useRef(null)
  const rafRef = useRef(0)
  const locsRef = useRef(null)
  const textCanvasRef = useRef(null)
  const textTextureRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    })
    if (!gl) return

    glRef.current = gl

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, VERT_SRC)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(vs))
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, FRAG_SRC)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(fs))
    }

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.bindAttribLocation(program, 0, 'a_pos')
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
    }
    programRef.current = program

    // Fullscreen triangle (covers screen with fewer vertices)
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    const verts = new Float32Array([
      -1, -1,  3, -1,  -1, 3,
    ])
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    gl.useProgram(program)
    const locResolution = gl.getUniformLocation(program, 'iResolution')
    const locTime = gl.getUniformLocation(program, 'iTime')
    const locSeed = gl.getUniformLocation(program, 'uSeed')
    const locText = gl.getUniformLocation(program, 'iText')
    const locTextRes = gl.getUniformLocation(program, 'iTextResolution')
    locsRef.current = { locResolution, locTime, locSeed, locText, locTextRes }

    const seed = hashStringToUnitVec3(seedStr)
    gl.uniform3f(locSeed, seed[0], seed[1], seed[2])

    // Prepare text canvas + texture
    textCanvasRef.current = document.createElement('canvas')
    const textTex = gl.createTexture()
    textTextureRef.current = textTex
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, textTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.uniform1i(locsRef.current.locText, 0)

    function drawTextToTexture(width, height) {
      const tCanvas = textCanvasRef.current
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      tCanvas.width = Math.max(2, Math.floor(width))
      tCanvas.height = Math.max(2, Math.floor(height))
      const ctx = tCanvas.getContext('2d')
      ctx.clearRect(0, 0, tCanvas.width, tCanvas.height)
      // Background fully transparent
      // Draw centered name text with shadow glow
      const shorter = Math.min(tCanvas.width, tCanvas.height)
      const fontSize = Math.round(Math.max(48 * dpr, Math.min(shorter * 0.18, 220 * dpr)))
      ctx.fillStyle = 'rgba(255,255,255,1)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(140,170,255,0.8)'
      ctx.shadowBlur = Math.round(fontSize * 0.35)
      ctx.font = `700 ${fontSize}px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`
      ctx.fillText(seedStr, tCanvas.width / 2, tCanvas.height / 2)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, textTex)
      // Flip Y so top-left 2D canvas aligns with WebGL's bottom-left texture coords
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        tCanvas
      )
      gl.uniform2f(locsRef.current.locTextRes, tCanvas.width, tCanvas.height)
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.floor(canvas.clientWidth * dpr)
      const h = Math.floor(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      gl.uniform2f(locResolution, canvas.width, canvas.height)
      // Update text to match canvas size for 1:1 sampling
      drawTextToTexture(canvas.width, canvas.height)
    }

    let start = performance.now()
    function frame(now) {
      resize()
      const t = (now - start) / 1000
      gl.uniform1f(locsRef.current.locTime, t)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)

    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.bindVertexArray(null)
      gl.bindBuffer(gl.ARRAY_BUFFER, null)
      if (textTextureRef.current) {
        gl.deleteTexture(textTextureRef.current)
      }
    }
  }, [seedStr])

  return (
    <div className="shader-wrap">
      <canvas ref={canvasRef} className="shader-canvas" />
    </div>
  )
}
