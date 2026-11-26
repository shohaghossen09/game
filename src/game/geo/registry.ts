/** District registry — Phase G (Task 7).
 *  All 64 districts of Bangladesh with coordinates, grouped by division.
 *  Metadata only — tile geometry comes from the OpenStreetMap baker
 *  (npm run fetch:world / fetch:district). Used by the streaming manager
 *  for neighbor preloading and future fast-travel. */

export interface DistrictInfo {
  id: string;
  name: string;
  division: string;
  lat: number;
  lon: number;
}

export const DISTRICTS: DistrictInfo[] = [
  // Dhaka division (13)
  { id: 'dhaka', name: 'Dhaka', division: 'Dhaka', lat: 23.8103, lon: 90.4125 },
  { id: 'faridpur', name: 'Faridpur', division: 'Dhaka', lat: 23.6070, lon: 89.8429 },
  { id: 'gazipur', name: 'Gazipur', division: 'Dhaka', lat: 23.9999, lon: 90.4203 },
  { id: 'gopalganj', name: 'Gopalganj', division: 'Dhaka', lat: 23.0050, lon: 89.8266 },
  { id: 'kishoreganj', name: 'Kishoreganj', division: 'Dhaka', lat: 24.4449, lon: 90.7766 },
  { id: 'madaripur', name: 'Madaripur', division: 'Dhaka', lat: 23.1641, lon: 90.1897 },
  { id: 'manikganj', name: 'Manikganj', division: 'Dhaka', lat: 23.8644, lon: 90.0287 },
  { id: 'munshiganj', name: 'Munshiganj', division: 'Dhaka', lat: 23.5422, lon: 90.5305 },
  { id: 'narayanganj', name: 'Narayanganj', division: 'Dhaka', lat: 23.6238, lon: 90.4997 },
  { id: 'narsingdi', name: 'Narsingdi', division: 'Dhaka', lat: 23.9322, lon: 90.7151 },
  { id: 'rajbari', name: 'Rajbari', division: 'Dhaka', lat: 23.7574, lon: 89.6444 },
  { id: 'shariatpur', name: 'Shariatpur', division: 'Dhaka', lat: 23.2423, lon: 90.4348 },
  { id: 'tangail', name: 'Tangail', division: 'Dhaka', lat: 24.2513, lon: 89.9166 },
  // Chattogram division (11)
  { id: 'bandarban', name: 'Bandarban', division: 'Chattogram', lat: 22.1953, lon: 92.2184 },
  { id: 'brahmanbaria', name: 'Brahmanbaria', division: 'Chattogram', lat: 23.9571, lon: 91.1119 },
  { id: 'chandpur', name: 'Chandpur', division: 'Chattogram', lat: 23.2333, lon: 90.6712 },
  { id: 'chattogram', name: 'Chattogram', division: 'Chattogram', lat: 22.3569, lon: 91.7832 },
  { id: 'cumilla', name: 'Cumilla', division: 'Chattogram', lat: 23.4607, lon: 91.1809 },
  { id: 'coxsbazar', name: "Cox's Bazar", division: 'Chattogram', lat: 21.4272, lon: 92.0058 },
  { id: 'feni', name: 'Feni', division: 'Chattogram', lat: 23.0159, lon: 91.3976 },
  { id: 'khagrachhari', name: 'Khagrachhari', division: 'Chattogram', lat: 23.1193, lon: 91.9847 },
  { id: 'lakshmipur', name: 'Lakshmipur', division: 'Chattogram', lat: 22.9447, lon: 90.8282 },
  { id: 'noakhali', name: 'Noakhali', division: 'Chattogram', lat: 22.8696, lon: 91.0995 },
  { id: 'rangamati', name: 'Rangamati', division: 'Chattogram', lat: 22.6533, lon: 92.1735 },
  // Barishal division (6)
  { id: 'barishal', name: 'Barishal', division: 'Barishal', lat: 22.7010, lon: 90.3535 },
  { id: 'barguna', name: 'Barguna', division: 'Barishal', lat: 22.0953, lon: 90.1121 },
  { id: 'bhola', name: 'Bhola', division: 'Barishal', lat: 22.6859, lon: 90.6482 },
  { id: 'jhalokati', name: 'Jhalokati', division: 'Barishal', lat: 22.6406, lon: 90.1997 },
  { id: 'patuakhali', name: 'Patuakhali', division: 'Barishal', lat: 22.3596, lon: 90.3298 },
  { id: 'pirojpur', name: 'Pirojpur', division: 'Barishal', lat: 22.5841, lon: 89.9720 },
  // Khulna division (10)
  { id: 'bagerhat', name: 'Bagerhat', division: 'Khulna', lat: 22.6516, lon: 89.7859 },
  { id: 'chuadanga', name: 'Chuadanga', division: 'Khulna', lat: 23.6402, lon: 88.8418 },
  { id: 'jashore', name: 'Jashore', division: 'Khulna', lat: 23.1664, lon: 89.2081 },
  { id: 'jhenaidah', name: 'Jhenaidah', division: 'Khulna', lat: 23.5450, lon: 88.9243 },
  { id: 'khulna', name: 'Khulna', division: 'Khulna', lat: 22.8456, lon: 89.5403 },
  { id: 'kushtia', name: 'Kushtia', division: 'Khulna', lat: 23.9013, lon: 89.1206 },
  { id: 'magura', name: 'Magura', division: 'Khulna', lat: 23.4855, lon: 89.4198 },
  { id: 'meherpur', name: 'Meherpur', division: 'Khulna', lat: 23.7622, lon: 88.6318 },
  { id: 'narail', name: 'Narail', division: 'Khulna', lat: 23.1725, lon: 89.5126 },
  { id: 'satkhira', name: 'Satkhira', division: 'Khulna', lat: 22.7185, lon: 89.0705 },
  // Rajshahi division (8)
  { id: 'bogura', name: 'Bogura', division: 'Rajshahi', lat: 24.8481, lon: 89.3730 },
  { id: 'chapainawabganj', name: 'Chapainawabganj', division: 'Rajshahi', lat: 24.5965, lon: 88.2775 },
  { id: 'joypurhat', name: 'Joypurhat', division: 'Rajshahi', lat: 25.0947, lon: 89.0227 },
  { id: 'naogaon', name: 'Naogaon', division: 'Rajshahi', lat: 24.9137, lon: 88.7530 },
  { id: 'natore', name: 'Natore', division: 'Rajshahi', lat: 24.4206, lon: 89.0004 },
  { id: 'pabna', name: 'Pabna', division: 'Rajshahi', lat: 24.0064, lon: 89.2372 },
  { id: 'rajshahi', name: 'Rajshahi', division: 'Rajshahi', lat: 24.3745, lon: 88.6042 },
  { id: 'sirajganj', name: 'Sirajganj', division: 'Rajshahi', lat: 24.4534, lon: 89.7007 },
  // Rangpur division (8)
  { id: 'dinajpur', name: 'Dinajpur', division: 'Rangpur', lat: 25.6217, lon: 88.6354 },
  { id: 'gaibandha', name: 'Gaibandha', division: 'Rangpur', lat: 25.3288, lon: 89.5281 },
  { id: 'kurigram', name: 'Kurigram', division: 'Rangpur', lat: 25.8054, lon: 89.6362 },
  { id: 'lalmonirhat', name: 'Lalmonirhat', division: 'Rangpur', lat: 25.9923, lon: 89.2847 },
  { id: 'nilphamari', name: 'Nilphamari', division: 'Rangpur', lat: 25.9317, lon: 88.8560 },
  { id: 'panchagarh', name: 'Panchagarh', division: 'Rangpur', lat: 26.3411, lon: 88.5542 },
  { id: 'rangpur', name: 'Rangpur', division: 'Rangpur', lat: 25.7439, lon: 89.2752 },
  { id: 'thakurgaon', name: 'Thakurgaon', division: 'Rangpur', lat: 26.0337, lon: 88.4616 },
  // Mymensingh division (4)
  { id: 'jamalpur', name: 'Jamalpur', division: 'Mymensingh', lat: 24.9375, lon: 89.9372 },
  { id: 'mymensingh', name: 'Mymensingh', division: 'Mymensingh', lat: 24.7471, lon: 90.4203 },
  { id: 'netrokona', name: 'Netrokona', division: 'Mymensingh', lat: 24.8821, lon: 90.7271 },
  { id: 'sherpur', name: 'Sherpur', division: 'Mymensingh', lat: 25.0205, lon: 90.0153 },
  // Sylhet division (4)
  { id: 'habiganj', name: 'Habiganj', division: 'Sylhet', lat: 24.3745, lon: 91.4155 },
  { id: 'moulvibazar', name: 'Moulvibazar', division: 'Sylhet', lat: 24.4829, lon: 91.7774 },
  { id: 'sunamganj', name: 'Sunamganj', division: 'Sylhet', lat: 25.0658, lon: 91.3950 },
  { id: 'sylhet', name: 'Sylhet', division: 'Sylhet', lat: 24.8949, lon: 91.8687 }
];

export const DISTRICT_COUNT = DISTRICTS.length; // 64

export function districtById(id: string): DistrictInfo | null {
  return DISTRICTS.find((d) => d.id === id) ?? null;
}

/** The n geographically nearest districts to the given district
 *  (excluding itself) — used for background neighbor preloading. */
export function nearestDistricts(id: string, n: number): DistrictInfo[] {
  const origin = districtById(id);
  if (!origin) return [];
  return DISTRICTS.filter((d) => d.id !== id)
    .map((d) => ({
      d,
      dist: Math.hypot(
        (d.lon - origin.lon) * 100 * 0.9,
        (d.lat - origin.lat) * 100
      )
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n)
    .map((e) => e.d);
}
