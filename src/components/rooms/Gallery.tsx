import GalleryClient from "@/components/gallery/GalleryClient";

/**
 * Room: Gallery — Command Center telemetry strip + filterable, live
 * GitHub-backed project grid + flat stack-map filter diagram.
 * See FINAL_CREATIVE_DIRECTION.md section 5 for the data-layer contract.
 */
export default function Gallery() {
  return (
    <section
      id="gallery"
      // Structural guarantee (Option A, "Console shrink repair" doc): reserve
      // a flat 160px inset (132px widget + 24px margin, rounded up) in this
      // room's bottom-right corner so the Command Center strip, Stack Map,
      // and project grid can never lay out into the space the fixed,
      // persistent Console widget docks in — instead of relying on the
      // widget's transparency/z-index alone. Gated to `pointer: fine` since
      // the widget never mounts on coarse-pointer/touch devices (see
      // Lobby.tsx's gate), so mobile isn't left reserving space for a widget
      // that isn't there.
      //
      // This same 160px zone comfortably contains GalleryClient's
      // Gallery-scoped `CoordinateHUD` (fixed `bottom-4 right-4`, i.e. 16px
      // margin — well inside the 160px inset), so the HUD now sits inside a
      // corner the grid structurally can't reach either, rather than the two
      // fixed elements coexisting only by z-index coincidence.
      className="flex min-h-screen justify-center bg-[var(--background)] [@media(pointer:fine)]:pr-[160px] [@media(pointer:fine)]:pb-[160px]"
    >
      <GalleryClient />
    </section>
  );
}
