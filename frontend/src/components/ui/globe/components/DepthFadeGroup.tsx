import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { Group, MathUtils, Mesh, Vector3 } from 'three';

type Props = {
  minOpacity?: number;
  exponent?: number;
  children: React.ReactNode;
};

/**
 * Wraps children and applies depth-based opacity fade in a single useFrame,
 * replacing per-icon useDepthFade hooks (46 hooks → 1).
 */
export default function DepthFadeGroup({
  minOpacity = 0.15,
  exponent = 1.5,
  children,
}: Props) {
  const groupRef = useRef<Group>(null);
  const tmp = useMemo(() => new Vector3(), []);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;

    const camDist = camera.position.length();

    groupRef.current.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh || !mesh.material) return;

      mesh.getWorldPosition(tmp);
      const rEff = tmp.length();
      const minD = Math.max(1e-4, camDist - rEff);
      const maxD = camDist + rEff;
      const d = camera.position.distanceTo(tmp);

      let t = MathUtils.clamp((d - minD) / (maxD - minD), 0, 1);
      if (exponent !== 1) t = Math.pow(t, exponent);

      const alpha = MathUtils.lerp(1, minOpacity, t);

      const mat = mesh.material;
      if (Array.isArray(mat)) {
        for (const m of mat) {
          m.transparent = true;
          m.depthWrite = false;
          m.depthTest = false;
          m.opacity = alpha;
        }
      } else {
        mat.transparent = true;
        mat.depthWrite = false;
        mat.depthTest = false;
        mat.opacity = alpha;
      }
    });
  });

  return <group ref={groupRef}>{children}</group>;
}
