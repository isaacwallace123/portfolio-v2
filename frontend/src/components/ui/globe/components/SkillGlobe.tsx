import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';

import AutoRotateGroup from '../core/AutoRotateGroup';
import DepthFadeGroup from './DepthFadeGroup';
import IconBillboard from './ImageBillboard';
import Connections from './Connections';

import { useContainerSize } from '../hooks/useContainerSize';
import { useGlobeResponsive } from '../hooks/useGlobeResponsive';
import { useUniformPoints } from '../hooks/useUniformPoints';

import type { SkillItem } from '../types';
import { distanceForSphereFit, suggestedNearFar } from '../utils/camera';

type Props = {
  skills: SkillItem[];
  radius?: number;
  height?: number;
  className?: string;
  rotateAuto?: boolean;
  rotateSpeed?: number;

  neighbors?: number;

  lineColor?: string;
  connectionsColor?: string;
  lineOpacity?: number;

  radiusScale?: number;
  cameraPadding?: number;

  iconSize?: number;
  iconOffset?: number;

  depthFade?: boolean;
  depthFadeMinOpacity?: number;
  depthFadeExponent?: number;
};

export default function SkillGlobe({
  skills,
  radius: baseRadius = 1.6,
  height = 460,
  className,
  rotateAuto = true,
  rotateSpeed = 0.5,

  neighbors = 2,

  lineColor = '#3b82f6',
  connectionsColor,
  lineOpacity = 0.35,

  radiusScale = 0.92,
  cameraPadding = 1.225,

  iconSize = 0.22,
  iconOffset = 0.16,

  depthFade = true,
  depthFadeMinOpacity = 0.15,
  depthFadeExponent = 1.5,
}: Props) {
  const R = useGlobeResponsive({
    height,
    radiusScale,
    cameraPadding,
    iconSize,
    iconOffset,
    neighbors,
    lineOpacity,
  });

  const { ref: wrapRef, width: wrapW } = useContainerSize<HTMLDivElement>();

  const maxW = R.isMobile ? '92vw' : 'min(92vw, 740px)';
  const mHeight = R.height;
  const aspect = useMemo(
    () => Math.max(0.5, wrapW / mHeight),
    [wrapW, mHeight]
  );

  const connColor = connectionsColor ?? lineColor;
  const radius = baseRadius * R.radiusScale;

  const { skillPoints } = useUniformPoints(skills, radius);

  const fov = 45;

  const distance = distanceForSphereFit({
    radius,
    fovDeg: fov,
    aspect,
    padding: R.cameraPadding,
  });

  const { near, far } = suggestedNearFar(radius, distance);

  const icons = useMemo(
    () =>
      skillPoints
        .filter(({ skill }) => skill.icon)
        .map(({ pos, skill }) => (
          <IconBillboard
            key={skill.label}
            position={pos}
            url={skill.icon!}
            size={R.iconSize}
            offset={R.iconOffset}
          />
        )),
    [skillPoints, R.iconSize, R.iconOffset]
  );

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        height: mHeight,
        width: '100%',
        maxWidth: maxW as string,
        marginInline: 'auto',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, distance], fov, near, far }}
        dpr={R.dpr}
        gl={{ powerPreference: 'low-power' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 2]} intensity={0.9} />

        <AutoRotateGroup enabled={rotateAuto} speed={rotateSpeed}>
          <Suspense fallback={null}>
            <Connections
              skillPoints={skillPoints}
              radius={radius}
              lineColor={connColor}
              lineOpacity={R.lineOpacity}
            />

            {depthFade ? (
              <DepthFadeGroup
                minOpacity={depthFadeMinOpacity}
                exponent={depthFadeExponent}
              >
                {icons}
              </DepthFadeGroup>
            ) : (
              <group>{icons}</group>
            )}
          </Suspense>
        </AutoRotateGroup>
      </Canvas>
    </div>
  );
}
