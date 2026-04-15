import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BG = 0x0f0e0d;
const TERRA = 0xbc5f40;
const GOLD = 0xdca842;
const GREY = 0x888888;

/**
 * Backdrop: deep-field stars (slow drift).
 * Story: page spark (left) → context ring (center) → synthesis cluster (right),
 * connected by particles flowing along a 3D curve (capture → personalize → explain).
 */
export function WebGLBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(BG, 0.0018);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1200);
    camera.position.z = 105;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // --- Cosmos (distant field, slow parallax) ---
    const cosmosCount = 1800;
    const cosmosGeo = new THREE.BufferGeometry();
    const cosmosPos = new Float32Array(cosmosCount * 3);
    for (let i = 0; i < cosmosCount * 3; i += 3) {
      const r = 280 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      cosmosPos[i] = r * Math.sin(phi) * Math.cos(theta);
      cosmosPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      cosmosPos[i + 2] = r * Math.cos(phi);
    }
    cosmosGeo.setAttribute('position', new THREE.BufferAttribute(cosmosPos, 3));
    const cosmosMat = new THREE.PointsMaterial({
      size: 1.2,
      color: GREY,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cosmos = new THREE.Points(cosmosGeo, cosmosMat);
    scene.add(cosmos);

    // --- Narrative path: page → your context → synthesis ---
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-92, 12, -8),
      new THREE.Vector3(-48, 4, -2),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(42, -6, 10),
      new THREE.Vector3(88, 8, 14),
    ]);

    // --- "Page" spark: flat cluster = selection on a surface ---
    const pageGroup = new THREE.Group();
    pageGroup.position.set(-78, 6, 2);
    const pageGeo = new THREE.BufferGeometry();
    const pageN = 48;
    const pagePos = new Float32Array(pageN * 3);
    for (let i = 0; i < pageN; i++) {
      pagePos[i * 3] = (Math.random() - 0.5) * 36;
      pagePos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pagePos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    pageGeo.setAttribute('position', new THREE.BufferAttribute(pagePos, 3));
    const pageMat = new THREE.PointsMaterial({
      size: 2,
      color: GOLD,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    pageGroup.add(new THREE.Points(pageGeo, pageMat));
    scene.add(pageGroup);

    // --- Context ring (personal lens) ---
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(16, 0.35, 10, 48),
      new THREE.MeshBasicMaterial({
        color: TERRA,
        transparent: true,
        opacity: 0.35,
        wireframe: true,
      }),
    );
    ring.rotation.x = Math.PI / 2.4;
    scene.add(ring);

    const ringGlow = new THREE.PointLight(TERRA, 1.2, 120);
    ring.add(ringGlow);

    // --- Flow along path ---
    const flowCount = 140;
    const flowGeo = new THREE.BufferGeometry();
    const flowPos = new Float32Array(flowCount * 3);
    const flowPhase = new Float32Array(flowCount);
    for (let i = 0; i < flowCount; i++) {
      flowPhase[i] = (i / flowCount) * 0.97 + Math.random() * 0.03;
    }
    flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
    const flowMat = new THREE.PointsMaterial({
      size: 2.2,
      color: GOLD,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flowPoints = new THREE.Points(flowGeo, flowMat);
    scene.add(flowPoints);

    // --- Synthesis cluster (neural "output") ---
    const brainGroup = new THREE.Group();
    brainGroup.position.set(78, 2, 8);
    const brainCount = 220;
    const brainGeo = new THREE.BufferGeometry();
    const brainPos = new Float32Array(brainCount * 3);
    for (let i = 0; i < brainCount * 3; i += 3) {
      const r = 34 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      brainPos[i] = r * Math.sin(phi) * Math.cos(theta);
      brainPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      brainPos[i + 2] = r * Math.cos(phi);
    }
    brainGeo.setAttribute('position', new THREE.BufferAttribute(brainPos, 3));
    const brainMat = new THREE.PointsMaterial({
      size: 2.6,
      color: TERRA,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
    });
    brainGroup.add(new THREE.Points(brainGeo, brainMat));

    const linePositions: number[] = [];
    const maxD2 = 260;
    for (let i = 0; i < brainCount; i++) {
      for (let j = i + 1; j < brainCount; j++) {
        const a = i * 3;
        const b = j * 3;
        const dx = brainPos[a] - brainPos[b];
        const dy = brainPos[a + 1] - brainPos[b + 1];
        const dz = brainPos[a + 2] - brainPos[b + 2];
        if (dx * dx + dy * dy + dz * dz < maxD2) {
          linePositions.push(
            brainPos[a],
            brainPos[a + 1],
            brainPos[a + 2],
            brainPos[b],
            brainPos[b + 1],
            brainPos[b + 2],
          );
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: TERRA,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
    });
    brainGroup.add(new THREE.LineSegments(lineGeo, lineMat));

    const pulse = new THREE.PointLight(GOLD, 1.4, 90);
    brainGroup.add(pulse);
    scene.add(brainGroup);

    const clock = new THREE.Clock();
    let mouseX = 0;
    let mouseY = 0;
    let targetCamX = 0;
    let targetCamY = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      targetCamX = (e.clientX - window.innerWidth / 2) * 0.04;
      targetCamY = (e.clientY - window.innerHeight / 2) * 0.03;
    };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);

    const animate = () => {
      const t = clock.getElapsedTime();

      // Cosmos: very slow drift (depth field)
      cosmos.rotation.y = t * 0.018;
      cosmos.rotation.x = t * 0.008;
      cosmosMat.opacity = 0.32 + Math.sin(t * 0.35) * 0.12;

      // Page spark: subtle breathe
      pageGroup.scale.setScalar(1 + Math.sin(t * 1.8) * 0.04);
      pageMat.opacity = 0.65 + Math.sin(t * 2.1) * 0.2;

      // Context ring: slow gimbal + pulse
      ring.rotation.z = t * 0.11;
      ring.rotation.y = Math.sin(t * 0.25) * 0.15;
      ringGlow.intensity = 1 + Math.sin(t * 2.4) * 0.35;

      // Flow: particles travel path (capture → context → gist)
      const speed = 0.045;
      for (let i = 0; i < flowCount; i++) {
        flowPhase[i] += speed * (0.85 + (i % 7) * 0.02);
        if (flowPhase[i] > 1) flowPhase[i] -= 1;
        const p = path.getPointAt(flowPhase[i]);
        flowPos[i * 3] = p.x;
        flowPos[i * 3 + 1] = p.y;
        flowPos[i * 3 + 2] = p.z;
      }
      flowGeo.attributes.position.needsUpdate = true;
      flowMat.opacity = 0.55 + Math.sin(t * 0.9 + 1) * 0.35;

      // Synthesis cluster
      brainGroup.rotation.y = t * 0.052;
      brainGroup.rotation.z = Math.sin(t * 0.22) * 0.08;
      const sc = 1 + Math.sin(t * 0.95) * 0.045;
      brainGroup.scale.set(sc, sc, sc);
      lineMat.opacity = 0.08 + Math.sin(t * 0.7) * 0.08;
      pulse.intensity = 1.2 + Math.sin(t * 2.1) * 0.45;

      // Camera: gentle mouse parallax (foreground reads faster than stars)
      mouseX += (targetCamX - mouseX) * 0.06;
      mouseY += (targetCamY - mouseY) * 0.06;
      camera.position.x = mouseX;
      camera.position.y = mouseY;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      cosmosGeo.dispose();
      cosmosMat.dispose();
      flowGeo.dispose();
      flowMat.dispose();
      pageGeo.dispose();
      pageMat.dispose();
      brainGeo.dispose();
      brainMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: 'radial-gradient(circle at 50% 45%, #1a1513 0%, #0f0e0d 55%, #0a0908 100%)',
      }}
      aria-hidden
    />
  );
}

/** Static fallback when prefers-reduced-motion or before canvas mounts. */
export function WebGLBackgroundReduced() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 70% 40%, rgba(188,95,64,0.12) 0%, transparent 50%), radial-gradient(circle at 50% 50%, #1a1513 0%, #0f0e0d 100%)',
      }}
      aria-hidden
    />
  );
}
