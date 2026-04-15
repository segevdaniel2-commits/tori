import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

// Detect WebGL support before trying to create a renderer.
// Some mobile GPUs / browser configs silently return null for the context.
function checkWebGLSupport() {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export function WebGLShader({ className = "fixed top-0 left-0 w-full h-full block" }) {
  const canvasRef = useRef(null)
  const sceneRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  })
  // If WebGL fails, just render nothing (transparent canvas) instead of crashing
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    // Skip entirely on devices without WebGL
    if (!checkWebGLSupport()) {
      setFailed(true)
      return
    }

    const canvas = canvasRef.current
    const { current: refs } = sceneRef

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

    // Use mediump instead of highp — highp is not guaranteed on all mobile GPUs
    const fragmentShader = `
      precision mediump float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

        float d = length(p) * distortion;

        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);

        float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);

        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms) return
      const width = window.innerWidth
      const height = window.innerHeight
      refs.renderer.setSize(width, height, false)
      refs.uniforms.resolution.value = [width, height]
    }

    const initScene = () => {
      refs.scene = new THREE.Scene()
      refs.renderer = new THREE.WebGLRenderer({ canvas, powerPreference: 'low-power', antialias: false })
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      refs.renderer.setClearColor(new THREE.Color(0x000000))

      refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

      refs.uniforms = {
        resolution: { value: [window.innerWidth, window.innerHeight] },
        time: { value: 0.0 },
        xScale: { value: 1.0 },
        yScale: { value: 0.5 },
        distortion: { value: 0.05 },
      }

      const position = [
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0,  1.0, 0.0,
      ]

      const positions = new THREE.BufferAttribute(new Float32Array(position), 3)
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute("position", positions)

      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: refs.uniforms,
        side: THREE.DoubleSide,
      })

      refs.mesh = new THREE.Mesh(geometry, material)
      refs.scene.add(refs.mesh)

      handleResize()
    }

    const animate = () => {
      if (refs.uniforms) refs.uniforms.time.value += 0.01
      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera)
      }
      refs.animationId = requestAnimationFrame(animate)
    }

    try {
      initScene()
      animate()
      window.addEventListener("resize", handleResize)
    } catch (err) {
      console.warn('[WebGLShader] WebGL initialization failed — disabling shader background.', err?.message)
      setFailed(true)
    }

    return () => {
      if (refs.animationId) cancelAnimationFrame(refs.animationId)
      window.removeEventListener("resize", handleResize)
      try {
        if (refs.mesh) {
          refs.scene?.remove(refs.mesh)
          refs.mesh.geometry.dispose()
          if (refs.mesh.material instanceof THREE.Material) refs.mesh.material.dispose()
        }
        refs.renderer?.dispose()
      } catch { /* ignore cleanup errors */ }
    }
  }, [])

  // On failure, render nothing — the page still shows its own background gradient
  if (failed) return null

  return (
    <canvas
      ref={canvasRef}
      className={className}
    />
  )
}
