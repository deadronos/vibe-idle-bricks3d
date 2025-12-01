import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
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
                <Text
                    key={item.id}
                    position={item.position}
                    color={item.color}
                    fontSize={0.8}
                    outlineWidth={0.05}
                    outlineColor="black"
                    fillOpacity={item.life / TEXT_LIFE}
                >
                    {item.text}
                </Text>
            ))}
        </>
    );
}
