import * as THREE from 'three';

/** GPU-friendly rain: a single Points cloud around the camera that wraps
 *  vertically. Opacity/count scale with weather intensity. */

export class RainSystem {
  private points: THREE.Points;
  private velocities: Float32Array;
  private positions: Float32Array;
  private readonly count: number;
  private readonly area = 40; // meters around camera
  private readonly top = 24;

  constructor(scene: THREE.Scene, maxCount: number) {
    this.count = maxCount;
    this.positions = new Float32Array(maxCount * 3);
    this.velocities = new Float32Array(maxCount);
    for (let i = 0; i < maxCount; i++) {
      this.resetDrop(i, true);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xa8c8e0,
      size: 0.12,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  private resetDrop(i: number, scatter = false): void {
    this.positions[i * 3] = (Math.random() * 2 - 1) * this.area;
    this.positions[i * 3 + 1] = scatter ? Math.random() * this.top : this.top;
    this.positions[i * 3 + 2] = (Math.random() * 2 - 1) * this.area;
    this.velocities[i] = 18 + Math.random() * 10;
  }

  update(dt: number, intensity: number, camX: number, camZ: number): void {
    const mat = this.points.material as THREE.PointsMaterial;
    mat.opacity = intensity * 0.7;
    if (intensity < 0.05) {
      this.points.visible = false;
      return;
    }
    this.points.visible = true;

    const active = Math.floor(this.count * intensity);
    for (let i = 0; i < active; i++) {
      this.positions[i * 3 + 1] -= this.velocities[i] * dt;
      if (this.positions[i * 3 + 1] < 0) this.resetDrop(i);
    }
    // reposition cloud around camera
    this.points.position.set(camX, 0, camZ);
    const attr = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
    // draw range keeps inactive drops off the GPU
    this.points.geometry.setDrawRange(0, active);
  }

  dispose(): void {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
    this.points.parent?.remove(this.points);
  }
}
