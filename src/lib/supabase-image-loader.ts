export default function supabaseImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Return all URLs as-is — Supabase Image Transformations (render endpoint)
  // requires a Pro plan feature that may not be enabled.
  // The original /object/public/ URLs serve images directly.
  return src;
}
