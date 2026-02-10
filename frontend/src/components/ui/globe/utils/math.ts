import { BufferGeometry, Quaternion, Vector3 } from 'three';

export function arcGeometry(
  aTuple: [number, number, number],
  bTuple: [number, number, number],
  radius: number,
  segments = 24
) {
  const a = new Vector3(...aTuple).normalize();
  const b = new Vector3(...bTuple).normalize();

  const dot = Math.min(1, Math.max(-1, a.dot(b)));
  const angle = Math.acos(dot);

  let axis = new Vector3().crossVectors(a, b);

  if (axis.lengthSq() < 1e-10) {
    axis = new Vector3(1, 0, 0).cross(a);

    if (axis.lengthSq() < 1e-10) axis = new Vector3(0, 1, 0).cross(a);
  }

  axis.normalize();

  const quat = new Quaternion();
  const points: Vector3[] = [];

  if (angle < 1e-6) {
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      points.push(a.clone().lerp(b, t).normalize().multiplyScalar(radius));
    }
  } else {
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      quat.setFromAxisAngle(axis, t * angle);

      points.push(a.clone().applyQuaternion(quat).multiplyScalar(radius));
    }
  }

  return new BufferGeometry().setFromPoints(points);
}
