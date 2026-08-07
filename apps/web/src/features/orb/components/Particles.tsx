import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOrbStore } from '../../../stores/useOrbStore';
import { OrbState } from '../../../types';
import { useSettingsStore } from '../../../stores/useSettingsStore';

interface ParticleData {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  scale: number;
  baseRadius: number;
  phase: number;
}

export const Particles: React.FC = () => {
  const count = 300;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const currentState = useOrbStore((state) => state.state);
  const theme = useSettingsStore((state) => state.theme);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp: ParticleData[] = [];
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 10 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      const pos = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      
      temp.push({
        pos,
        vel: new THREE.Vector3(),
        scale: Math.random() * 0.05 + 0.01,
        baseRadius: radius,
        phase: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, [count]);

  const targetForces = useRef({ attraction: 0.1, orbit: 0.2, noise: 0.1, drag: 0.95, repulsion: 0 });

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Smoothly transition force profiles based on state
    let desired = { attraction: 0.1, orbit: 0.2, noise: 0.1, drag: 0.95, repulsion: 0 };
    
    switch (currentState) {
      case OrbState.Listening:
        desired = { attraction: 0.8, orbit: 0.2, noise: 0.05, drag: 0.9, repulsion: 0 };
        break;
      case OrbState.Thinking:
        desired = { attraction: 0.2, orbit: 1.0, noise: 0.4, drag: 0.95, repulsion: 0 };
        break;
      case OrbState.Speaking:
        desired = { attraction: 0.05, orbit: 0.3, noise: 0.2, drag: 0.98, repulsion: 0.5 };
        break;
      case OrbState.Error:
        desired = { attraction: -0.2, orbit: 0, noise: 1.0, drag: 0.8, repulsion: 1.0 };
        break;
      case OrbState.Sleeping:
        desired = { attraction: 0.05, orbit: 0.05, noise: 0.01, drag: 0.9, repulsion: 0 };
        break;
      case OrbState.Idle:
      default:
        desired = { attraction: 0.1, orbit: 0.2, noise: 0.1, drag: 0.95, repulsion: 0 };
        break;
    }
    
    // Lerp forces to targets
    const forces = targetForces.current;
    forces.attraction = THREE.MathUtils.lerp(forces.attraction, desired.attraction, delta * 2);
    forces.orbit = THREE.MathUtils.lerp(forces.orbit, desired.orbit, delta * 2);
    forces.noise = THREE.MathUtils.lerp(forces.noise, desired.noise, delta * 2);
    forces.drag = THREE.MathUtils.lerp(forces.drag, desired.drag, delta * 2);
    forces.repulsion = THREE.MathUtils.lerp(forces.repulsion, desired.repulsion, delta * 10);

    const time = state.clock.elapsedTime;
    
    particles.forEach((p, i) => {
      // 1. Attraction (to origin)
      const distToCenter = p.pos.length();
      const attractForce = p.pos.clone().normalize().multiplyScalar(-forces.attraction * (distToCenter * 0.1));
      
      // 2. Repulsion (push away from origin)
      const repulseForce = p.pos.clone().normalize().multiplyScalar(forces.repulsion * (10 / (distToCenter + 1)));

      // 3. Orbit (cross product with UP vector or a specific axis)
      const up = new THREE.Vector3(0, 1, 0);
      const orbitDir = p.pos.clone().cross(up).normalize();
      const orbitForce = orbitDir.multiplyScalar(forces.orbit * 5);

      // 4. Noise (wander)
      const noiseForce = new THREE.Vector3(
        Math.sin(time + p.phase) * forces.noise,
        Math.cos(time * 0.8 + p.phase) * forces.noise,
        Math.sin(time * 1.2 + p.phase) * forces.noise
      ).multiplyScalar(2);

      // Apply forces to velocity
      p.vel.add(attractForce.multiplyScalar(delta));
      p.vel.add(repulseForce.multiplyScalar(delta));
      p.vel.add(orbitForce.multiplyScalar(delta));
      p.vel.add(noiseForce.multiplyScalar(delta));

      // Apply drag
      p.vel.multiplyScalar(forces.drag);

      // Integrate position
      p.pos.add(p.vel.clone().multiplyScalar(delta * 10)); // Scale delta for visible speed

      // Update dummy instance
      dummy.position.copy(p.pos);
      
      // Scale based on state
      let scaleMult = 1;
      if (currentState === OrbState.Listening) scaleMult = 1.5;
      if (currentState === OrbState.Speaking) scaleMult = 1.2 + (forces.repulsion * 2);
      
      dummy.scale.setScalar(p.scale * scaleMult);
      dummy.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const materialColor = theme === 'light' ? '#000000' : '#ffffff';
  const materialOpacity = theme === 'light' ? 0.15 : 0.4;
  const blending = theme === 'light' ? THREE.NormalBlending : THREE.AdditiveBlending;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial 
        color={materialColor} 
        transparent 
        opacity={materialOpacity} 
        blending={blending} 
        depthWrite={false} 
      />
    </instancedMesh>
  );
};
