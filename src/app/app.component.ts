import { Component, ElementRef, inject, OnInit } from '@angular/core';
import { animationFrames, connectable, fromEvent, Subject } from 'rxjs';
import {
  map,
  switchMap,
  tap,
  startWith,
  share,
  pairwise,
  mergeMap,
  finalize,
} from 'rxjs/operators';
import { Player } from 'src/shared/player/player';
import { SpaceObject } from 'src/shared/space-objects/space-object';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'SpaceshipFighter';

  el: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {}

  ngOnInit(): void {
    const canvas =
      this.el.nativeElement.querySelector<HTMLCanvasElement>('canvas')!;

    canvas.style.cursor = 'none';

    const ctx = canvas.getContext('2d')!;

    const forceRender = new Subject<any>();

    const player = new Player(canvas, () => forceRender.next(0));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      player.draw();
    };

    const animationTime$ = animationFrames().pipe(
      map((event) => event.elapsed / 1000),
      pairwise(),
      map(([prev, curr]) => curr - prev),
      tap(() => {
        render();
      }),
      finalize(() => {
        render();
      }),
      share({
        connector: () => forceRender,
        resetOnComplete: true,
        resetOnError: true,
        resetOnRefCountZero: true,
      })
    );

    fromEvent(window, 'resize')
      .pipe(
        startWith(0),
        tap(() => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        })
      )
      .subscribe();

    player.clickFire$
      .pipe(
        mergeMap((event) => {
          const spaceObject = new SpaceObject(canvas, animationTime$, {
            x: event.x,
            y: event.y,
          });
          return spaceObject.moveUp();
        })
      )
      .subscribe();
  }
}
