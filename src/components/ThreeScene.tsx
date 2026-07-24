import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function ThreeScene() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000,
        );
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        camera.position.z = 5;

        const geometry = new THREE.RingGeometry();
        const material = new THREE.MeshBasicMaterial({
            color: 'red',
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
        });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        let animationFrameId = window.requestAnimationFrame(function renderScene() {
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
            animationFrameId = window.requestAnimationFrame(renderScene);
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            scene.remove(cube);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            container.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={containerRef} />;
}

export default ThreeScene;