import { Billboard, Image } from '@react-three/drei';
import { useMemo } from 'react';
import { Vector3 } from 'three';

type Props = {
  position: [number, number, number];
  url: string;
  size?: number;
  offset?: number;
};

export default function IconBillboard({
  position,
  url,
  size = 0.22,
  offset = 0.16,
}: Props) {
  const worldPos = useMemo<[number, number, number]>(() => {
    const base = new Vector3(...position);
    return base
      .clone()
      .add(base.clone().normalize().multiplyScalar(offset))
      .toArray() as [number, number, number];
  }, [position, offset]);

  return (
    <Billboard follow position={worldPos}>
      <Image url={url} scale={[size, size]} toneMapped={false} transparent />
    </Billboard>
  );
}
