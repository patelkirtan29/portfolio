"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import type { Group, PointLight } from "three";
import { UnfoldContext } from "./UnfoldContext";
import { Desk } from "./scene/Desk";
import { Books } from "./scene/Books";
import { Plant } from "./scene/Plant";
import { Laptop } from "./scene/Laptop";
import { Mug } from "./scene/Mug";
import { Lamp } from "./scene/Lamp";
import { StickyNote } from "./scene/StickyNote";

/**
 * The unfold timeline — Canva spec §1 stagger table, reproduced exactly
 * via absolute GSAP timeline labels (not chained `+=`) so the overlap
 * percentages stay exact:
 *
 *   0.00s desk slab    ~0.35s  power2.out
 *   0.15s books        0.35s   back.out (tiny overshoot)
 *   0.35s plant        0.45s   power2.out rise + staggered leaf unfurl
 *   0.55s laptop lid    0.5s   back.out(1.4) "click"
 *   0.85s mug           0.3s   back.out pop
 *   1.05s lamp          0.35s  power2.out arm + light intensity
 *   1.20s sticky note   0.4s   elastic.out(1, 0.5) settle askew
 *
 * Total runtime 1.6s. `hasUnfolded` (a ref, not state — see
 * UnfoldContext) flips true on the timeline's onComplete and gates every
 * idle-loop behavior in the scene.
 */
export function DeskGroup() {
  const hasUnfolded = useRef(false);

  const deskRef = useRef<Group>(null);
  const booksRef = useRef<Group>(null);
  const plantPotRef = useRef<Group>(null);
  const leaf0Ref = useRef<Group>(null);
  const leaf1Ref = useRef<Group>(null);
  const leaf2Ref = useRef<Group>(null);
  const laptopLidRef = useRef<Group>(null);
  const mugRef = useRef<Group>(null);
  const lampArmRef = useRef<Group>(null);
  const lampLightRef = useRef<PointLight>(null);
  const stickyRef = useRef<Group>(null);

  const leafRefs = useMemo(() => [leaf0Ref, leaf1Ref, leaf2Ref], []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => {
          hasUnfolded.current = true;
        },
      });

      // Desk slab — the "page" opening.
      if (deskRef.current) {
        gsap.set(deskRef.current.rotation, { x: -Math.PI / 2 });
        gsap.set(deskRef.current.scale, { x: 0.9, y: 0.9, z: 0.9 });
        tl.to(deskRef.current.rotation, { x: 0, duration: 0.35, ease: "power2.out" }, 0);
        tl.to(deskRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: "power2.out" }, 0);
      }

      // Books — fold up from flat with a tiny overshoot bounce.
      if (booksRef.current) {
        gsap.set(booksRef.current.scale, { y: 0.001 });
        tl.to(booksRef.current.scale, { y: 1, duration: 0.35, ease: "back.out(2.2)" }, 0.15);
      }

      // Plant — pot rises, leaves unfurl with a 0.05s stagger between them.
      if (plantPotRef.current) {
        gsap.set(plantPotRef.current.position, { y: -0.08 });
        tl.to(plantPotRef.current.position, { y: 0, duration: 0.45, ease: "power2.out" }, 0.35);
      }
      leafRefs.forEach((leaf, i) => {
        if (!leaf.current) return;
        gsap.set(leaf.current.scale, { y: 0.001 });
        tl.to(leaf.current.scale, { y: 1, duration: 0.4, ease: "power2.out" }, 0.35 + i * 0.05);
      });

      // Laptop lid — rotates open with a satisfying "click" overshoot.
      if (laptopLidRef.current) {
        gsap.set(laptopLidRef.current.rotation, { x: 0 });
        tl.to(
          laptopLidRef.current.rotation,
          { x: -((100 * Math.PI) / 180), duration: 0.5, ease: "back.out(1.4)" },
          0.55,
        );
      }

      // Mug — pops up with scale + slight rotate.
      if (mugRef.current) {
        gsap.set(mugRef.current.scale, { x: 0.001, y: 0.001, z: 0.001 });
        gsap.set(mugRef.current.rotation, { z: -0.3 });
        tl.to(mugRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.3, ease: "back.out(1.7)" }, 0.85);
        tl.to(mugRef.current.rotation, { z: 0, duration: 0.3, ease: "back.out(1.7)" }, 0.85);
      }

      // Lamp — arm articulates upright, point light flicks on.
      if (lampArmRef.current) {
        gsap.set(lampArmRef.current.rotation, { x: -1.1 });
        tl.to(lampArmRef.current.rotation, { x: 0, duration: 0.35, ease: "power2.out" }, 1.05);
      }
      if (lampLightRef.current) {
        gsap.set(lampLightRef.current, { intensity: 0 });
        tl.to(lampLightRef.current, { intensity: 1.1, duration: 0.3, ease: "power1.out" }, 1.05);
      }

      // Sticky note — last, flips up and settles askew with one small wobble.
      if (stickyRef.current) {
        gsap.set(stickyRef.current.rotation, { x: -1.4 });
        tl.to(stickyRef.current.rotation, { x: -0.15, duration: 0.4, ease: "elastic.out(1, 0.5)" }, 1.2);
      }
    });

    return () => ctx.revert();
  }, [leafRefs]);

  return (
    <UnfoldContext.Provider value={hasUnfolded}>
      <group position={[0, -0.15, 0]}>
        <Desk groupRef={deskRef} />
        <Books groupRef={booksRef} />
        <Plant potRef={plantPotRef} leafRefs={leafRefs} />
        <Laptop lidRef={laptopLidRef} />
        <Mug groupRef={mugRef} />
        <Lamp armRef={lampArmRef} lightRef={lampLightRef} />
        <StickyNote groupRef={stickyRef} />
      </group>
    </UnfoldContext.Provider>
  );
}
