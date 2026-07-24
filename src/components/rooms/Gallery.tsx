import GalleryClient from "@/components/gallery/GalleryClient";

/**
 * Room: Gallery — Command Center telemetry strip + filterable, live
 * GitHub-backed project grid + flat stack-map filter diagram.
 * See FINAL_CREATIVE_DIRECTION.md section 5 for the data-layer contract.
 */
export default function Gallery() {
  return (
    <section id="gallery" className="flex min-h-screen justify-center bg-[var(--background)]">
      <GalleryClient />
    </section>
  );
}
