import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { effectBus, type EffectEvent } from '../../systems/EffectEventBus';

interface FloatingTextItem {
    id: number;
    position: THREE.Vector3;
    text: string;
    color: string;
    life: number;
    velocity: THREE.Vector3;
}

const TEXT_LIFE = 0.8;

export function FloatingText() {
    const [items, setItems] = useState<FloatingTextItem[]>([]);
    const nextId = useRef(0);
    const { camera } = useThree();

    useEffect(() => {
        const handleEffect = (event: EffectEvent) => {
            if (event.amount && event.amount > 0) {
                const id = nextId.current++;
                setItems(prev => [...prev, {
                    id,
                    position: new THREE.Vector3(...event.position).add(new THREE.Vector3(0, 1, 0)),
                    text: Math.round(event.amount!).toString(),
                    color: event.color,
                    life: TEXT_LIFE,
                    velocity: new THREE.Vector3(0, 2, 0)
                }]);
            }
        };

        return effectBus.subscribe(handleEffect);
    }, []);

    useFrame((_state, delta) => {
        if (items.length === 0) return;

        setItems(prev => prev.map(item => ({
            ...item,
            life: item.life - delta,
            position: item.position.clone().addScaledVector(item.velocity, delta)
        })).filter(item => item.life > 0));
    });

    return (
        <>
            {items.map(item => (
                <FloatingLabel key={item.id} item={item} camera={camera} />
            ))}
        </>
    );
}

function FloatingLabel({ item, camera }: { item: FloatingTextItem; camera: THREE.Camera }) {
    const ref = useRef<THREE.Object3D | null>(null);
    const scratch = useRef({
        pos: new THREE.Vector3(),
        cam: new THREE.Vector3(),
        targetQuat: new THREE.Quaternion()
    });

    useFrame((_state, delta) => {
        const o = ref.current;
        if (!o) return;

        // Smoothly rotate to face the camera, but only around the Y axis
        const pos = scratch.current.pos;
        const camPos = scratch.current.cam;
        o.getWorldPosition(pos);
        camera.getWorldPosition(camPos);

        const dx = camPos.x - pos.x;
        const dz = camPos.z - pos.z;
        if (Math.abs(dx) < 1e-5 && Math.abs(dz) < 1e-5) return;

        const angle = Math.atan2(dx, dz);
        scratch.current.targetQuat.setFromEuler(new THREE.Euler(0, angle, 0));

        const speed = 8; // larger = snappier
        const t = 1 - Math.exp(-speed * delta);
        o.quaternion.slerp(scratch.current.targetQuat, t);
    });

    return (
        <Text
            ref={ref}
            position={item.position}
            color={item.color}
            fontSize={0.8}
            outlineWidth={0.05}
            outlineColor="black"
            fillOpacity={item.life / TEXT_LIFE}
        >
            {item.text}
        </Text>
    );
}
