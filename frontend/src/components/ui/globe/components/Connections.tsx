import { useMemo } from 'react';
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineSegments,
  ShaderMaterial,
  Vector3,
} from 'three';
import type { SkillPoint } from '../types';

type Props = {
  skillPoints: SkillPoint[];
  radius: number;
  lineColor: string;
  lineOpacity: number;
  minOpacity?: number;
  fadeExponent?: number;
};

/**
 * Compute convex hull edges of 3D points.
 * For points on a sphere, this gives the spherical Delaunay triangulation —
 * a clean triangular mesh (geodesic wireframe) with no crossing edges.
 */
function convexHullEdges(pts: Vector3[]): [number, number][] {
  const n = pts.length;
  if (n < 3) return [];

  const edges = new Set<string>();
  const v1 = new Vector3();
  const v2 = new Vector3();
  const normal = new Vector3();
  const diff = new Vector3();

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        v1.copy(pts[j]).sub(pts[i]);
        v2.copy(pts[k]).sub(pts[i]);
        normal.crossVectors(v1, v2);

        if (normal.lengthSq() < 1e-10) continue;

        let pos = 0;
        let neg = 0;
        let valid = true;

        for (let l = 0; l < n; l++) {
          if (l === i || l === j || l === k) continue;
          diff.copy(pts[l]).sub(pts[i]);
          const d = normal.dot(diff);
          if (d > 1e-10) pos++;
          else if (d < -1e-10) neg++;
          if (pos > 0 && neg > 0) {
            valid = false;
            break;
          }
        }

        if (valid) {
          const add = (a: number, b: number) => {
            const key = a < b ? `${a}-${b}` : `${b}-${a}`;
            edges.add(key);
          };
          add(i, j);
          add(j, k);
          add(i, k);
        }
      }
    }
  }

  return [...edges].map((key) => {
    const [a, b] = key.split('-').map(Number);
    return [a, b] as [number, number];
  });
}

const vertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uMinOpacity;
  uniform float uExponent;

  varying vec3 vWorldPos;

  void main() {
    float camDist = length(cameraPosition);
    float rEff = length(vWorldPos);
    float d = distance(cameraPosition, vWorldPos);

    float minD = max(0.0001, camDist - rEff);
    float maxD = camDist + rEff;

    float t = clamp((d - minD) / (maxD - minD), 0.0, 1.0);
    t = pow(t, uExponent);

    float alpha = mix(uOpacity, uOpacity * uMinOpacity, t);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export default function Connections({
  skillPoints,
  radius,
  lineColor,
  lineOpacity,
  minOpacity = 0.15,
  fadeExponent = 1.5,
}: Props) {
  const mesh = useMemo(() => {
    if (skillPoints.length < 3) return null;

    const color = new Color(lineColor);

    const mat = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      uniforms: {
        uColor: { value: [color.r, color.g, color.b] },
        uOpacity: { value: lineOpacity },
        uMinOpacity: { value: minOpacity },
        uExponent: { value: fadeExponent },
      },
    });

    const pts = skillPoints.map((sp) => new Vector3(...sp.pos));
    const edges = convexHullEdges(pts);

    const positions: number[] = [];
    for (const [ai, bi] of edges) {
      const pa = pts[ai].clone().setLength(radius);
      const pb = pts[bi].clone().setLength(radius);
      positions.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
    }

    if (positions.length === 0) return null;

    const geom = new BufferGeometry();
    geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return new LineSegments(geom, mat);
  }, [skillPoints, lineColor, lineOpacity, radius, minOpacity, fadeExponent]);

  if (!mesh) return null;
  return <primitive object={mesh} />;
}
