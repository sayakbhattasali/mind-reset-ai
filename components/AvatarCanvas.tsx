"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float } from "@react-three/drei";
import { Suspense, useRef, useState, useEffect, Component, ReactNode } from "react";
import * as THREE from "three";

// Error boundary to prevent 3D WebGL crashes from breaking the UI page
class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function BreathingSphere() {
  const outerMeshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    // 8 second total cycle (4s inhale, 4s exhale)
    const cycle = (Math.sin((elapsed * Math.PI * 2) / 8 - Math.PI / 2) + 1) / 2;
    const scale = 1 + cycle * 0.35;

    if (outerMeshRef.current) {
      outerMeshRef.current.scale.set(scale, scale, scale);
      outerMeshRef.current.rotation.y = elapsed * 0.15;
      outerMeshRef.current.rotation.x = Math.sin(elapsed * 0.1) * 0.1;
    }

    if (innerMeshRef.current) {
      const innerScale = 0.8 + cycle * 0.2;
      innerMeshRef.current.scale.set(innerScale, innerScale, innerScale);
    }
  });

  return (
    <group>
      {/* Outer Wireframe Sphere */}
      <mesh ref={outerMeshRef}>
        <sphereGeometry args={[1.2, 48, 48]} />
        <meshStandardMaterial
          color="#34d399"
          wireframe
          transparent
          opacity={0.35}
          emissive="#10b981"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Inner Glowing Core */}
      <mesh ref={innerMeshRef}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial
          color="#059669"
          transparent
          opacity={0.25}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

function FallbackSphere() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-surface/80">
      <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-2 border-emerald-500/40 bg-emerald-500/10 blur-sm animate-pulse flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        <div className="w-24 h-24 rounded-full border border-emerald-400/60 bg-emerald-500/20" />
      </div>
    </div>
  );
}

export default function AvatarCanvas() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full h-[280px] sm:h-[340px] md:h-[380px] max-h-[45vh] rounded-2xl overflow-hidden bg-surface/60 border border-emerald-500/20 relative shadow-2xl shadow-emerald-950/20">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50 z-10 pointer-events-none" />
      
      {!mounted ? (
        <FallbackSphere />
      ) : (
        <WebGLErrorBoundary fallback={<FallbackSphere />}>
          <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
            <Suspense fallback={null}>
              <Environment preset="city" />
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={1.2} />
              <pointLight position={[-10, -10, -5]} intensity={0.5} color="#10b981" />
              <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                <BreathingSphere />
              </Float>
              <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 2.5} />
            </Suspense>
          </Canvas>
        </WebGLErrorBoundary>
      )}
    </div>
  );
}
