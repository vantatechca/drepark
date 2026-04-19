const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export function getStreetViewUrl(
  lat: number,
  lng: number,
  heading: number = 0,
  size: string = "800x400"
): string {
  if (!API_KEY) return "";
  return (
    `https://maps.googleapis.com/maps/api/streetview` +
    `?size=${size}` +
    `&location=${lat},${lng}` +
    `&heading=${heading}` +
    `&pitch=0` +
    `&fov=90` +
    `&key=${API_KEY}`
  );
}

export function getStaticMapUrl(
  lat: number,
  lng: number,
  zoom: number = 15,
  size: string = "600x300"
): string {
  if (!API_KEY) return "";
  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${lat},${lng}` +
    `&zoom=${zoom}` +
    `&size=${size}` +
    `&maptype=roadmap` +
    `&markers=color:gold%7C${lat},${lng}` +
    `&style=feature:all|element:geometry|color:0x1a1a2e` +
    `&style=feature:all|element:labels.text.fill|color:0xd4a843` +
    `&key=${API_KEY}`
  );
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function getNavigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function hasGoogleMapsKey(): boolean {
  return !!API_KEY;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
