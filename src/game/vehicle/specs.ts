/** Vehicle category definitions — each with distinct handling, dimensions,
 *  and visual profile. Data-driven: adding a vehicle type is a table entry. */

export type VehicleCategory =
  | 'sedan'
  | 'cng'
  | 'rickshaw'
  | 'motorcycle'
  | 'bus';

export interface VehicleSpec {
  label: string;
  maxSpeed: number;        // m/s forward
  maxReverse: number;      // m/s
  accel: number;           // m/s^2
  brakeOrReverseAccel: number;
  steerRate: number;       // yaw response factor
  drag: number;
  /** body dims */
  bodyW: number; bodyH: number; bodyL: number;
  /** collision half-width (used for AABB pushout) */
  collideHalf: number;
  wheelR: number;
  color: number;
  cabin: boolean;
  seats: number;
}

export const VEHICLE_SPECS: Record<VehicleCategory, VehicleSpec> = {
  sedan: {
    label: 'Private Car',
    maxSpeed: 26, maxReverse: 9,
    accel: 14, brakeOrReverseAccel: 10,
    steerRate: 0.14, drag: 0.5,
    bodyW: 1.9, bodyH: 0.62, bodyL: 4.4,
    collideHalf: 1.2, wheelR: 0.34,
    color: 0x8a1f1f, cabin: true, seats: 4
  },
  cng: {
    label: 'CNG Auto-Rickshaw',
    maxSpeed: 14, maxReverse: 4,
    accel: 9, brakeOrReverseAccel: 6,
    steerRate: 0.22, drag: 0.7,
    bodyW: 1.4, bodyH: 1.3, bodyL: 2.4,
    collideHalf: 0.9, wheelR: 0.26,
    color: 0x2e7d32, cabin: true, seats: 3
  },
  rickshaw: {
    label: 'Rickshaw',
    maxSpeed: 7, maxReverse: 2,
    accel: 5, brakeOrReverseAccel: 4,
    steerRate: 0.3, drag: 0.9,
    bodyW: 1.1, bodyH: 1.0, bodyL: 2.2,
    collideHalf: 0.7, wheelR: 0.32,
    color: 0x1565c0, cabin: false, seats: 2
  },
  motorcycle: {
    label: 'Motorcycle',
    maxSpeed: 24, maxReverse: 3,
    accel: 16, brakeOrReverseAccel: 12,
    steerRate: 0.26, drag: 0.4,
    bodyW: 0.5, bodyH: 0.5, bodyL: 1.9,
    collideHalf: 0.5, wheelR: 0.3,
    color: 0xd84315, cabin: false, seats: 2
  },
  bus: {
    label: 'Local Bus',
    maxSpeed: 20, maxReverse: 5,
    accel: 7, brakeOrReverseAccel: 6,
    steerRate: 0.08, drag: 0.45,
    bodyW: 2.5, bodyH: 2.6, bodyL: 9.5,
    collideHalf: 1.6, wheelR: 0.5,
    color: 0x00695c, cabin: true, seats: 40
  }
};
