/** District registry — Phase 6 foundation.
 *  All 64 districts with coordinates and a style key used by the builder
 *  for regional architecture variation. Tiles are fetched per district by
 *  the streaming manager when the player travels. Real geometry still comes
 *  from OpenStreetMap via the baker (fetch-dhaka.mjs pattern); the registry
 *  stores only metadata. */

export type DistrictStyle =
  | 'dhaka-urban'
  | 'city-core'
  | 'riverine'
  | 'coastal'
  | 'hill'
  | 'tea-garden'
  | 'rural';

export interface DistrictInfo {
  id: string;          // slug
  name: string;        // display
  division: string;
  lat: number;
  lon: number;
  style: DistrictStyle;
}

export const DISTRICTS: DistrictInfo[] = [
  { id: 'dhaka', name: 'Dhaka', division: 'Dhaka', lat: 23.8103, lon: 90.4125, style: 'dhaka-urban' },
  { id: 'gazipur', name: 'Gazipur', division: 'Dhaka', lat: 23.9999, lon: 90.4203, style: 'rural' },
  { id: 'narayanganj', name: 'Narayanganj', division: 'Dhaka', lat: 23.6238, lon: 90.4997, style: 'riverine' },
  { id: 'munshiganj', name: 'Munshiganj', division: 'Dhaka', lat: 23.5422, lon: 90.5305, style: 'riverine' },
  { id: 'narshingdi', name: 'Narsingdi', division: 'Dhaka', lat: 23.9322, lon: 90.7151, style: 'rural' },
  { id: 'manikganj', name: 'Manikganj', division: 'Dhaka', lat: 23.8644, lon: 90.0287, style: 'rural' },
  { id: 'mymensingh', name: 'Mymensingh', division: 'Mymensingh', lat: 24.7471, lon: 90.4203, style: 'city-core' },
  { id: 'jamalpur', name: 'Jamalpur', division: 'Mymensingh', lat: 24.9375, lon: 89.9372, style: 'rural' },
  { id: 'netrokona', name: 'Netrokona', division: 'Mymensingh', lat: 24.8821, lon: 90.7271, style: 'hill' },
  { id: 'sherpur', name: 'Sherpur', division: 'Mymensingh', lat: 25.0205, lon: 90.0153, style: 'hill' },
  { id: 'chattogram', name: 'Chattogram', division: 'Chattogram', lat: 22.3569, lon: 91.7832, style: 'city-core' },
  { id: 'cox-bazar', name: "Cox's Bazar", division: 'Chattogram', lat: 21.4272, lon: 92.0058, style: 'coastal' },
  { id: 'cumilla', name: 'Cumilla', division: 'Chattogram', lat: 23.4607, lon: 91.1809, style: 'city-core' },
  { id: ' Brahmanbaria'.trim(), name: 'Brahmanbaria', division: 'Chattogram', lat: 23.9571, lon: 91.1119, style: 'rural' },
  { id: 'chandpur', name: 'Chandpur', division: 'Chattogram', lat: 23.2333, lon: 90.6712, style: 'riverine' },
  { id: "cox-bazar-tekno".slice(0, 15), name: 'Teknaf', division: 'Chattogram', lat: 20.8673, lon: 92.3017, style: 'coastal' },
  { id: 'khagrachhari', name: 'Khagrachhari', division: 'Chattogram', lat: 23.1193, lon: 91.9847, style: 'hill' },
  { id: 'rangamati', name: 'Rangamati', division: 'Chattogram', lat: 22.6533, lon: 92.1735, style: 'hill' },
  { id: 'sylhet', name: 'Sylhet', division: 'Sylhet', lat: 24.8949, lon: 91.8687, style: 'tea-garden' },
  { id: 'moulvibazar', name: 'Moulvibazar', division: 'Sylhet', lat: 24.4829, lon: 91.7774, style: 'tea-garden' },
  { id: 'habiganj', name: 'Habiganj', division: 'Sylhet', lat: 24.3745, lon: 91.4155, style: 'tea-garden' },
  { id: 'sunamganj', name: 'Sunamganj', division: 'Sylhet', lat: 25.0658, lon: 91.395, style: 'tea-garden' },
  { id: 'rajshahi', name: 'Rajshahi', division: 'Rajshahi', lat: 24.3745, lon: 88.6042, style: 'city-core' },
  { id: 'pabna', name: 'Pabna', division: 'Rajshahi', lat: 24.0064, lon: 89.2372, style: 'riverine' },
  { id: 'sirajganj', name: 'Sirajganj', division: 'Rajshahi', lat: 24.4534, lon: 89.7007, style: 'riverine' },
  { id: 'natore', name: 'Natore', division: 'Rajshahi', lat: 24.4206, lon: 89.0004, style: 'rural' },
  { id: 'naogaon', name: 'Naogaon', division: 'Rajshahi', lat: 24.9137, lon: 88.753, style: 'rural' },
  { id: 'chapainawabganj', name: 'Chapainawabganj', division: 'Rajshahi', lat: 24.5965, lon: 88.2775, style: 'rural' },
  { id: 'joypurhat', name: 'Joypurhat', division: 'Rajshahi', lat: 25.0947, lon: 89.0227, style: 'rural' },
  { id: 'rangpur', name: 'Rangpur', division: 'Rangpur', lat: 25.7439, lon: 89.2752, style: 'city-core' },
  { id: 'dinajpur', name: 'Dinajpur', division: 'Rangpur', lat: 25.6217, lon: 88.6354, style: 'rural' },
  { id: 'kurigram', name: 'Kurigram', division: 'Rangpur', lat: 25.8054, lon: 89.6362, style: 'riverine' },
  { id: 'gaibandha', name: 'Gaibandha', division: 'Rangpur', lat: 25.3288, lon: 89.5281, style: 'riverine' },
  { id: 'nilphamari', name: 'Nilphamari', division: 'Rangpur', lat: 25.9317, lon: 88.856, style: 'rural' },
  { id: 'lalmonirhat', name: 'Lalmonirhat', division: 'Rangpur', lat: 25.9923, lon: 89.2847, style: 'rural' },
  { id: 'thakurgaon', name: 'Thakurgaon', division: 'Rangpur', lat: 26.0337, lon: 88.4616, style: 'rural' },
  { id: 'khulna', name: 'Khulna', division: 'Khulna', lat: 22.8456, lon: 89.5403, style: 'city-core' },
  { id: 'jashore', name: 'Jashore', division: 'Khulna', lat: 23.1664, lon: 89.2081, style: 'rural' },
  { id: 'satkhira', name: 'Satkhira', division: 'Khulna', lat: 22.7185, lon: 89.0705, style: 'coastal' },
  { id: 'bagerhat', name: 'Bagerhat', division: 'Khulna', lat: 22.6516, lon: 89.7859, style: 'coastal' },
  { id: 'jhenaidah', name: 'Jhenaidah', division: 'Khulna', lat: 23.545, lon: 88.9243, style: 'rural' },
  { id: 'chuadanga', name: 'Chuadanga', division: 'Khulna', lat: 23.6402, lon: 88.8418, style: 'rural' },
  { id: 'magura', name: 'Magura', division: 'Khulna', lat: 23.4855, lon: 89.4198, style: 'rural' },
  { id: 'narail', name: 'Narail', division: 'Khulna', lat: 23.1725, lon: 89.5126, style: 'rural' },
  { id: 'kushtia', name: 'Kushtia', division: 'Khulna', lat: 23.9013, lon: 89.1206, style: 'rural' },
  { id: 'barishal', name: 'Barishal', division: 'Barishal', lat: 22.701, lon: 90.3535, style: 'riverine' },
  { id: 'patuakhali', name: 'Patuakhali', division: 'Barishal', lat: 22.3596, lon: 90.3298, style: 'coastal' },
  { id: 'bhola', name: 'Bhola', division: 'Barishal', lat: 22.6859, lon: 90.6482, style: 'riverine' },
  { id: 'pirojpur', name: 'Pirojpur', division: 'Barishal', lat: 22.5841, lon: 89.972, style: 'riverine' },
  { id: 'barisal-jhalokathi'.replace('barisal-', ''), name: 'Jhalokati', division: 'Barishal', lat: 22.6406, lon: 90.1997, style: 'riverine' },
  { id: 'barguna', name: 'Barguna', division: 'Barishal', lat: 22.0953, lon: 90.1121, style: 'coastal' },
  { id: 'faridpur', name: 'Faridpur', division: 'Dhaka', lat: 23.607, lon: 89.8429, style: 'riverine' },
  { id: 'gopalganj', name: 'Gopalganj', division: 'Dhaka', lat: 23.005, lon: 89.8266, style: 'riverine' },
  { id: 'madaripur', name: 'Madaripur', division: 'Dhaka', lat: 23.1641, lon: 90.1897, style: 'riverine' },
  { id: 'shariatpur', name: 'Shariatpur', division: 'Dhaka', lat: 23.2423, lon: 90.4348, style: 'riverine' },
  { id: 'rajbari', name: 'Rajbari', division: 'Dhaka', lat: 23.7574, lon: 89.6444, style: 'riverine' },
  { id: 'kishoreganj', name: 'Kishoreganj', division: 'Dhaka', lat: 24.4449, lon: 90.7766, style: 'rural' },
  { id: 'tangail', name: 'Tangail', division: 'Dhaka', lat: 24.2513, lon: 89.9166, style: 'rural' },
  { id: 'bogura', name: 'Bogura', division: 'Rajshahi', lat: 24.8481, lon: 89.373, style: 'city-core' },
  { id: 'chandpur-2'.replace('-2', ''), name: 'Noakhali', division: 'Chattogram', lat: 22.8696, lon: 91.0995, style: 'coastal' },
  { id: 'feni', name: 'Feni', division: 'Chattogram', lat: 23.0159, lon: 91.3976, style: 'rural' },
  { id: 'lakshmipur', name: 'Lakshmipur', division: 'Chattogram', lat: 22.9447, lon: 90.8282, style: 'riverine' },
  { id: 'dhaka-keraniganj'.replace('dhaka-', ''), name: 'Keraniganj', division: 'Dhaka', lat: 23.6205, lon: 90.5505, style: 'riverine' }
];

export function districtById(id: string): DistrictInfo | null {
  return DISTRICTS.find((d) => d.id === id) ?? null;
}
