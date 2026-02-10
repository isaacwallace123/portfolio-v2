import { useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef } from 'react';
import { Group, Quaternion, Vector3 } from 'three';

type Phase = 'auto' | 'dragging' | 'momentum' | 'paused';

type Props = {
  enabled: boolean;
  speed?: number;
  resumeDelay?: number;
  decayRate?: number;
  dragSensitivity?: number;
  children: React.ReactNode;
};

export default function AutoRotateGroup({
  enabled,
  speed = 0.6,
  resumeDelay = 1.0,
  decayRate = 3,
  dragSensitivity = 4,
  children,
}: Props) {
  const ref = useRef<Group | null>(null);
  const { gl, camera } = useThree();

  const state = useRef({
    phase: 'auto' as Phase,
    prevX: 0,
    prevY: 0,
    lastMoveTime: 0,
    angularSpeed: 0,
    lastAxis: new Vector3(0, 1, 0),
    idleTimer: 0,
  });

  const tmp = useMemo(
    () => ({
      q: new Quaternion(),
      v: new Vector3(),
      right: new Vector3(),
      up: new Vector3(),
      axis: new Vector3(),
    }),
    []
  );

  useEffect(() => {
    const el = gl.domElement;

    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      const s = state.current;
      s.phase = 'dragging';
      s.prevX = e.clientX;
      s.prevY = e.clientY;
      s.lastMoveTime = performance.now();
      s.angularSpeed = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      const s = state.current;
      if (s.phase !== 'dragging' || !ref.current) return;

      const now = performance.now();
      const dt = (now - s.lastMoveTime) / 1000;
      s.lastMoveTime = now;
      if (dt < 0.001) return;

      const w = el.clientWidth;
      const h = el.clientHeight;
      const dx = (e.clientX - s.prevX) / w;
      const dy = (e.clientY - s.prevY) / h;
      s.prevX = e.clientX;
      s.prevY = e.clientY;

      const angle = Math.sqrt(dx * dx + dy * dy) * dragSensitivity;
      if (angle < 0.00001) return;

      tmp.right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      tmp.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      tmp.axis
        .set(0, 0, 0)
        .addScaledVector(tmp.up, dx)
        .addScaledVector(tmp.right, dy)
        .normalize();

      tmp.q.setFromAxisAngle(tmp.axis, angle);
      ref.current.quaternion.premultiply(tmp.q);

      s.lastAxis.copy(tmp.axis);
      s.angularSpeed = angle / dt;
    };

    const onUp = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      const s = state.current;
      if (s.phase !== 'dragging') return;
      s.phase = s.angularSpeed > 0.05 ? 'momentum' : 'paused';
      s.idleTimer = 0;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [gl, camera, dragSensitivity, tmp]);

  useFrame(({ camera: cam }, dt) => {
    if (!ref.current) return;
    const s = state.current;

    switch (s.phase) {
      case 'dragging':
        break;

      case 'momentum':
        s.angularSpeed *= Math.exp(-decayRate * dt);
        if (s.angularSpeed < 0.05) {
          s.phase = 'paused';
          s.idleTimer = 0;
        } else {
          tmp.q.setFromAxisAngle(s.lastAxis, s.angularSpeed * dt);
          ref.current.quaternion.premultiply(tmp.q);
        }
        break;

      case 'paused':
        s.idleTimer += dt;
        if (s.idleTimer >= resumeDelay) {
          s.phase = 'auto';
        }
        break;

      case 'auto':
        if (enabled) {
          tmp.v.set(0, 1, 0).applyQuaternion(cam.quaternion);
          tmp.q.setFromAxisAngle(tmp.v, speed * dt);
          ref.current.quaternion.premultiply(tmp.q);
        }
        break;
    }
  });

  return <group ref={ref}>{children}</group>;
}
