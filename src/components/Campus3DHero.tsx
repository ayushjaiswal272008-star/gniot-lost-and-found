import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Sparkles, Eye, RotateCcw, Maximize2 } from 'lucide-react';

interface Campus3DHeroProps {
  onQuickReport?: (type: 'lost' | 'found') => void;
  onExploreSearch?: () => void;
  isDarkMode?: boolean;
}

export const Campus3DHero: React.FC<Campus3DHeroProps> = ({
  onQuickReport,
  onExploreSearch,
  isDarkMode = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeItemName, setActiveItemName] = useState<string>('GNIOT AI Radar (Scanning)');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isDarkMode ? 0x090d16 : 0xf8fafc, 0.04);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.2, 5.5);

    // Renderer
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDarkMode ? 1.2 : 1.05;
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(isDarkMode ? 0x223355 : 0xffffff, 0.8);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
      isDarkMode ? 0x6366f1 : 0xdbeafe,
      isDarkMode ? 0x090d16 : 0xf1f5f9,
      1.2
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 3.0, 10);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    const accentLight = new THREE.PointLight(0x818cf8, 2.5, 8);
    accentLight.position.set(2, -1, 1);
    scene.add(accentLight);

    // Master Group for Hero Items
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Procedural Texture Generator for ID Card
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 512;
    cardCanvas.height = 320;
    const ctx = cardCanvas.getContext('2d');
    if (ctx) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 512, 320);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 320);

      // Header bar
      ctx.fillStyle = '#f97316'; // GNIOT vibrant orange
      ctx.fillRect(0, 0, 512, 54);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('GNIOT GROUP OF INSTITUTIONS', 24, 36);

      ctx.font = '13px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('GREATER NOIDA | KNOWLEDGE PARK II', 24, 85);

      // Photo block
      ctx.fillStyle = '#334155';
      ctx.fillRect(24, 110, 110, 140);
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('STUDENT', 50, 185);

      // Student info
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('STUDENT SMART PASS', 150, 140);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px monospace';
      ctx.fillText('ID: 230133010xxxx', 150, 170);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px sans-serif';
      ctx.fillText('Dept: Computer Science & AI', 150, 200);
      ctx.fillText('Valid: 2023 - 2027', 150, 225);

      // Chip placeholder
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(400, 120, 54, 40);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(400, 120, 54, 40);
    }
    const cardTexture = new THREE.CanvasTexture(cardCanvas);
    cardTexture.colorSpace = THREE.SRGBColorSpace;
    cardTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // 1. Procedural 3D Composite: Student ID Card & Lanyard Clip (6 parts)
    const idCardGroup = new THREE.Group();
    // Part 1: Plastic Card Body
    const cardGeo = new THREE.BoxGeometry(1.6, 1.0, 0.02);
    const cardMat = new THREE.MeshPhysicalMaterial({
      map: cardTexture,
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
    });
    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    cardMesh.castShadow = true;
    idCardGroup.add(cardMesh);

    // Part 2: Top Lanyard Slot
    const slotGeo = new THREE.BoxGeometry(0.3, 0.05, 0.03);
    const slotMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
    const slotMesh = new THREE.Mesh(slotGeo, slotMat);
    slotMesh.position.set(0, 0.42, 0);
    idCardGroup.add(slotMesh);

    // Part 3: Metallic Clip
    const clipGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 16);
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
    });
    const clipMesh = new THREE.Mesh(clipGeo, metalMat);
    clipMesh.position.set(0, 0.55, 0.02);
    idCardGroup.add(clipMesh);

    // Part 4: Orange Ribbon Strap
    const strapGeo = new THREE.TorusGeometry(0.4, 0.04, 8, 32, Math.PI);
    const strapMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.7,
    });
    const strapMesh = new THREE.Mesh(strapGeo, strapMat);
    strapMesh.position.set(0, 0.65, 0.02);
    strapMesh.rotation.z = Math.PI;
    idCardGroup.add(strapMesh);

    idCardGroup.position.set(-1.8, 0.4, 0.2);
    idCardGroup.rotation.set(0.2, 0.35, -0.1);
    rootGroup.add(idCardGroup);

    // 2. Procedural 3D Composite: Wireless Earbuds Case (6 parts)
    const earbudsGroup = new THREE.Group();
    // Part 1: Bottom Case Body
    const caseGeo = new THREE.CylinderGeometry(0.45, 0.4, 0.5, 32);
    const caseMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e3a8a, // Navy Blue
      metalness: 0.3,
      roughness: 0.2,
      clearcoat: 0.7,
    });
    const caseBottom = new THREE.Mesh(caseGeo, caseMat);
    caseBottom.castShadow = true;
    earbudsGroup.add(caseBottom);

    // Part 2: Top Lid
    const lidGeo = new THREE.SphereGeometry(0.45, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const lidMesh = new THREE.Mesh(lidGeo, caseMat);
    lidMesh.position.set(0, 0.25, 0);
    lidMesh.castShadow = true;
    earbudsGroup.add(lidMesh);

    // Part 3: Metallic Chrome Hinge
    const hingeGeo = new THREE.BoxGeometry(0.2, 0.08, 0.06);
    const hingeMesh = new THREE.Mesh(hingeGeo, metalMat);
    hingeMesh.position.set(0, 0.24, -0.42);
    earbudsGroup.add(hingeMesh);

    // Part 4: LED Status Indicator Pill
    const ledGeo = new THREE.SphereGeometry(0.03, 16, 16);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0, 0.05, 0.43);
    earbudsGroup.add(ledMesh);

    earbudsGroup.position.set(1.9, 0.6, 0.1);
    earbudsGroup.rotation.set(0.3, -0.4, 0.2);
    rootGroup.add(earbudsGroup);

    // 3. Procedural 3D Composite: Titanium Smart Phone (8 parts)
    const phoneGroup = new THREE.Group();
    // Chassis
    const phoneGeo = new THREE.BoxGeometry(1.2, 2.3, 0.08);
    const phoneMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      clearcoat: 0.9,
    });
    const phoneBody = new THREE.Mesh(phoneGeo, phoneMat);
    phoneBody.castShadow = true;
    phoneGroup.add(phoneBody);

    // Screen Glass
    const screenGeo = new THREE.PlaneGeometry(1.1, 2.18);
    const screenMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.3,
      thickness: 0.1,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0, 0.045);
    phoneGroup.add(screenMesh);

    // Dynamic Island / Camera Notch
    const notchGeo = new THREE.CapsuleGeometry(0.04, 0.18, 4, 16);
    const notchMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const notch = new THREE.Mesh(notchGeo, notchMat);
    notch.rotation.z = Math.PI / 2;
    notch.position.set(0, 0.96, 0.05);
    phoneGroup.add(notch);

    // Camera Bump
    const bumpGeo = new THREE.BoxGeometry(0.48, 0.52, 0.05);
    const bumpMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3,
    });
    const bump = new THREE.Mesh(bumpGeo, bumpMat);
    bump.position.set(-0.3, 0.78, -0.06);
    phoneGroup.add(bump);

    // Triple Camera Lenses
    for (let i = 0; i < 3; i++) {
      const lensGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 24);
      lensGeo.rotateX(Math.PI / 2);
      const lensRing = new THREE.Mesh(lensGeo, metalMat);
      const lx = i === 2 ? -0.18 : (i === 0 ? -0.38 : -0.38);
      const ly = i === 2 ? 0.72 : (i === 0 ? 0.88 : 0.68);
      lensRing.position.set(lx, ly, -0.08);
      phoneGroup.add(lensRing);
    }

    phoneGroup.position.set(0.0, -0.2, 0.4);
    phoneGroup.rotation.set(-0.15, 0.2, 0.05);
    rootGroup.add(phoneGroup);

    // 4. Procedural 3D Composite: Brass Campus Dorm Keys & Fob (5 parts)
    const keyGroup = new THREE.Group();
    // Key Ring
    const ringGeo = new THREE.TorusGeometry(0.25, 0.025, 16, 32);
    const ringMesh = new THREE.Mesh(ringGeo, metalMat);
    keyGroup.add(ringMesh);

    // Brass Key 1
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.25,
    });
    const stemGeo = new THREE.BoxGeometry(0.08, 0.7, 0.02);
    const stemMesh = new THREE.Mesh(stemGeo, brassMat);
    stemMesh.position.set(0.12, -0.4, 0);
    keyGroup.add(stemMesh);

    // Key Bow (top head)
    const bowGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.02, 24);
    bowGeo.rotateX(Math.PI / 2);
    const bowMesh = new THREE.Mesh(bowGeo, brassMat);
    bowMesh.position.set(0.12, -0.05, 0);
    keyGroup.add(bowMesh);

    // Leather GNIOT Tag
    const tagGeo = new THREE.BoxGeometry(0.3, 0.6, 0.04);
    const tagMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      roughness: 0.6,
    });
    const tagMesh = new THREE.Mesh(tagGeo, tagMat);
    tagMesh.position.set(-0.2, -0.38, 0.02);
    tagMesh.rotation.z = 0.2;
    keyGroup.add(tagMesh);

    keyGroup.position.set(-1.6, -1.0, 0.1);
    keyGroup.rotation.set(0.4, 0.2, -0.3);
    rootGroup.add(keyGroup);

    // 5. Futuristic Scanning Grid Rings (symbolizing AI Radar)
    const radarGroup = new THREE.Group();
    const ring1Geo = new THREE.RingGeometry(2.8, 2.84, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat);
    ring1.rotation.x = Math.PI / 2.3;
    radarGroup.add(ring1);

    const ring2Geo = new THREE.RingGeometry(3.3, 3.33, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ringMat2);
    ring2.rotation.x = Math.PI / 2.3;
    radarGroup.add(ring2);

    radarGroup.position.set(0, -0.4, -0.5);
    scene.add(radarGroup);

    // Particle Constellation (AI Node Points)
    const particleCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArr[i] = (Math.random() - 0.5) * 8;
      posArr[i + 1] = (Math.random() - 0.5) * 6;
      posArr[i + 2] = (Math.random() - 0.5) * 4 - 0.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.045,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Mouse Parallax Interaction
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetMouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Render Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Damped mouse movement
      mouseX = THREE.MathUtils.damp(mouseX, targetMouseX, 4, delta);
      mouseY = THREE.MathUtils.damp(mouseY, targetMouseY, 4, delta);

      // Camera gentle reaction
      camera.position.x = mouseX * 0.45;
      camera.position.y = 1.2 + mouseY * 0.3;
      camera.lookAt(0, 0, 0);

      // Rotate radar scan ring
      ring1.rotation.z = elapsed * 0.2;
      ring2.rotation.z = -elapsed * 0.15;

      // Gentle floating animations for 3D items
      if (isRotating) {
        rootGroup.rotation.y = Math.sin(elapsed * 0.3) * 0.12;
      }

      // Individual item bobbing & rotations
      idCardGroup.position.y = 0.4 + Math.sin(elapsed * 1.4) * 0.08;
      idCardGroup.rotation.y = 0.35 + Math.cos(elapsed * 0.8) * 0.08;

      earbudsGroup.position.y = 0.6 + Math.sin(elapsed * 1.2 + 1) * 0.07;
      earbudsGroup.rotation.y = -0.4 + Math.sin(elapsed * 0.9) * 0.1;

      phoneGroup.position.y = -0.2 + Math.cos(elapsed * 1.1) * 0.05;
      phoneGroup.rotation.y = 0.2 + Math.sin(elapsed * 0.6) * 0.06;

      keyGroup.position.y = -1.0 + Math.sin(elapsed * 1.5 + 2) * 0.06;
      keyGroup.rotation.z = -0.3 + Math.cos(elapsed * 1.0) * 0.08;

      particles.rotation.y = elapsed * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isDarkMode, isRotating]);

  return (
    <div className="relative w-full h-[520px] sm:h-[620px] lg:h-[680px] overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 via-slate-100/60 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900/90 dark:to-indigo-950/30 shadow-2xl transition-all duration-300">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-60 dark:opacity-40" />

      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Badge */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8EDF2]/90 dark:bg-[#30152F]/90 border border-slate-300 dark:border-[#D9A441]/30 text-xs font-semibold text-[#30152F] dark:text-[#E8EDF2] shadow-sm backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-pulse" />
          <span>GNIOT AI Spatial Engine Active</span>
        </div>
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D9A441]/10 border border-[#D9A441]/30 text-xs font-medium text-[#BE8B2C] dark:text-[#D9A441]">
          <span>Greater Noida Campus</span>
        </div>
      </div>

      {/* Top Right 3D Controls */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsRotating(!isRotating)}
          title="Toggle Auto Floating Movement"
          className="p-2.5 rounded-xl bg-[#E8EDF2]/90 dark:bg-[#30152F]/90 border border-slate-300 dark:border-[#D9A441]/30 text-[#30152F] dark:text-[#E8EDF2] hover:text-[#D9A441] dark:hover:text-[#D9A441] hover:border-[#D9A441] shadow-sm backdrop-blur-md transition-all"
        >
          <RotateCcw className={`w-4 h-4 ${isRotating ? 'text-[#D9A441]' : ''}`} />
        </button>
      </div>

      {/* Unobstructed Central Overlay Content */}
      <div className="absolute inset-x-0 top-16 sm:top-20 z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pointer-events-none">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-[#D9A441]/10 dark:bg-[#D9A441]/15 border border-[#D9A441]/30 text-[#BE8B2C] dark:text-[#D9A441] text-xs sm:text-sm font-semibold tracking-wide uppercase">
          <Sparkles className="w-4 h-4 text-[#D9A441]" />
          Next-Gen Campus Recovery System
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#30152F] dark:text-[#E8EDF2] font-display drop-shadow-sm">
          Lost Something on Campus? <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#D9A441] via-[#F2C770] to-[#BE8B2C] bg-clip-text text-transparent">
            Let&apos;s Find It.
          </span>
        </h1>

        {/* Primary Action Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 pointer-events-auto">
          <button
            onClick={() => onQuickReport && onQuickReport('lost')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#D9A441] via-[#E4C56D] to-[#BE8B2C] hover:brightness-105 text-[#190918] font-bold text-sm sm:text-base shadow-lg shadow-[#D9A441]/30 hover:shadow-[#D9A441]/45 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#190918] animate-ping" />
            Report Lost Item
          </button>
          <button
            onClick={() => onQuickReport && onQuickReport('found')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#30152F] to-[#481E46] hover:from-[#240E23] hover:to-[#30152F] text-[#E8EDF2] font-semibold text-sm sm:text-base border border-[#D9A441]/40 shadow-lg shadow-[#30152F]/30 hover:shadow-[#30152F]/50 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#D9A441]" />
            Report Found Item
          </button>
          <button
            onClick={() => onExploreSearch && onExploreSearch()}
            className="px-5 py-3.5 rounded-2xl bg-[#E8EDF2]/90 dark:bg-[#2B112A]/90 hover:bg-white dark:hover:bg-[#30152F] border border-slate-300 dark:border-[#D9A441]/30 text-[#30152F] dark:text-[#E8EDF2] font-semibold text-sm sm:text-base shadow-md backdrop-blur-md transition-all flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-[#D9A441]" />
            Browse Registry
          </button>
        </div>
      </div>

      {/* Collapsible Unified Bottom Control Dock (Directive Compliant) */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl transition-all duration-300 ${
          hudCollapsed ? 'translate-y-[calc(100%-20px)] opacity-60' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="flex justify-center -mb-2.5">
          <button
            onClick={() => setHudCollapsed(!hudCollapsed)}
            className="px-3 py-1 rounded-t-lg bg-[#E8EDF2]/90 dark:bg-[#30152F]/90 border border-b-0 border-slate-300 dark:border-[#D9A441]/30 text-[11px] font-medium text-[#30152F] dark:text-[#E8EDF2] hover:text-[#D9A441] dark:hover:text-[#D9A441] backdrop-blur-md transition-all"
          >
            {hudCollapsed ? '▴ Show 3D Info & Desk Stats' : '▾ Collapse 3D HUD'}
          </button>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-[#E8EDF2]/90 dark:bg-[#2B112A]/90 border border-slate-300 dark:border-[#D9A441]/30 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-[#30152F] dark:text-[#E8EDF2]">
              <span className="font-semibold text-[#D9A441] font-mono">3D Interactive:</span>
              <span>Rotate &amp; float common lost items (ID Cards, Keys, Wallets, Earbuds, Gadgets)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Security Desk 1: Online</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441]" />
                <span>Library Counter 2: Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
