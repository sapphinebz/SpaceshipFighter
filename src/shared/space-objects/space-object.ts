import { animationFrames, AsyncSubject, Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

export class SpaceObject {
  onDestroy$ = new AsyncSubject<void>();
  x!: number;
  y!: number;
  radius = 5;
  speed = 1000;
  get ctx() {
    return this.canvas.getContext('2d')!;
  }
  constructor(
    public canvas: HTMLCanvasElement,
    public animationTime$: Observable<number>,
    public initPosition: { x: number; y: number }
  ) {
    this.x = initPosition.x;
    this.y = initPosition.y;
    this.draw();
  }

  draw() {
    this.ctx.beginPath();
    this.ctx.fillStyle = 'yellow';
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    this.ctx.fill();
    if (this.y - this.radius <= 0) {
      this.destroy();
    }
  }

  destroy() {
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  moveUp() {
    return this.animationTime$.pipe(
      tap((delta) => {
        this.y -= delta * this.speed;
        this.draw();
      }),
      takeUntil(this.onDestroy$)
    );
  }
}
