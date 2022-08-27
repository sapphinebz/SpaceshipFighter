import {
  animationFrames,
  AsyncSubject,
  defer,
  fromEvent,
  interval,
} from 'rxjs';
import {
  map,
  tap,
  switchMap,
  share,
  takeUntil,
  exhaustMap,
  throttleTime,
  withLatestFrom,
  startWith,
} from 'rxjs/operators';
import { SpaceObject } from '../space-objects/space-object';

export class Player {
  onDestroy$ = new AsyncSubject<void>();
  spaceship$ = this.loadSpaceship().pipe(share());
  mousemove$ = fromEvent<MouseEvent>(document, 'mousemove').pipe(share());
  canvasMousedown$ = fromEvent<MouseEvent>(this.canvas, 'mousedown').pipe(
    share()
  );
  canvasMousemove$ = fromEvent<MouseEvent>(this.canvas, 'mousemove').pipe(
    share()
  );
  canvasMouseup$ = fromEvent<MouseEvent>(this.canvas, 'mouseup').pipe(share());

  spaceshipImage?: HTMLImageElement;
  x!: number;
  y!: number;
  width!: number;
  height!: number;
  half_width!: number;
  half_height!: number;
  clickFire$ = this.clickFire().pipe(share());

  get ctx() {
    return this.canvas.getContext('2d')!;
  }
  constructor(
    public canvas: HTMLCanvasElement,
    public forceRender: () => void
  ) {
    this.spaceship$
      .pipe(
        switchMap((spaceshipImage) => {
          this.spaceshipImage = spaceshipImage;
          this.width = spaceshipImage.width / 10;
          this.height = spaceshipImage.height / 10;
          this.half_width = this.width / 2;
          this.half_height = this.height / 2;
          return this.mousemove$.pipe(
            tap((event) => {
              this.ctx.clearRect(0, 0, canvas.width, canvas.height);
              this.x = event.x;
              this.y = event.y;
              this.draw();
              this.forceRender();
            })
          );
        }),
        takeUntil(this.onDestroy$)
      )
      .subscribe();
  }

  draw() {
    if (this.spaceshipImage) {
      this.ctx.drawImage(
        this.spaceshipImage,
        0,
        0,
        this.spaceshipImage.width,
        this.spaceshipImage.height,
        this.x - this.half_width,
        this.y - this.half_height,
        this.width,
        this.height
      );
    }
  }

  private loadSpaceship() {
    return defer(() => {
      const spaceshipImage = new Image();
      spaceshipImage.src = '/assets/images/spaceship.png';

      return fromEvent(spaceshipImage, 'load').pipe(map(() => spaceshipImage));
    });
  }

  private clickFire() {
    return defer(() => {
      return this.spaceship$.pipe(
        switchMap(() => {
          return this.canvasMousedown$.pipe(
            exhaustMap((downEvent) => {
              return animationFrames().pipe(
                withLatestFrom(
                  this.canvasMousemove$.pipe(startWith(downEvent))
                ),
                throttleTime(100),
                map(([_, event]) => ({
                  x: event.x,
                  y: event.y - this.half_height,
                })),
                takeUntil(this.canvasMouseup$)
              );
            })
          );
        })
      );
    });
  }
}
