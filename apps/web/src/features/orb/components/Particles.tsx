import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOrbStore } from '../../../stores/useOrbStore';
import { OrbState } from '../../../types';

export const Particles: React.FC = () => {
  const count = 300;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const currentState = useOrbStore((state) => state.state);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 15;
      const y = (Math.random() - 0.5) * 15;
      const z = (Math.random() - 0.5) * 15;
      const scale = Math.random() * 0.05 + 0.01;
      const speed = Math.random() * 0.2 + 0.1;
      temp.push({ x, y, z, scale, speed });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Base speed
    let speedMult = 1.0;
    if (currentState === OrbState.Thinking) speedMult = 2.0;
    if (currentState === OrbState.Speaking) speedMult = 1.5;

    particles.forEach((particle, i) => {
      const t = time * particle.speed * speedMult;
      
      dummy.position.set(
        particle.x + Math.sin(t + particle.z) * 1.5,
        particle.y + Math.cos(t + particle.x) * 1.5,
        particle.z + Math.sin(t + particle.y) * 1.5
      );
      dummy.scale.setScalar(particle.scale);
      dummy.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // Slowly rotate the entire particle field
    meshRef.current.rotation.y = time * 0.05 * speedMult;
    meshRef.current.rotation.z = time * 0.02 * speedMult;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
};
