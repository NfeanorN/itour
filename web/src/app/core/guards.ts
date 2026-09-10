import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from './auth';

function whenReady(auth: AuthService) {
  return toObservable(auth.ready).pipe(
    filter((ready) => ready),
    take(1),
  );
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return whenReady(auth).pipe(
    map(() => (auth.user() ? true : router.createUrlTree(['/login'], { queryParams: { next: '/guide' } }))),
  );
};

export const guideGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return whenReady(auth).pipe(
    map(() => {
      if (auth.canReadGuides) {
        return true;
      }
      if (auth.user()) {
        return router.createUrlTree(['/login'], { queryParams: { locked: '1' } });
      }
      return router.createUrlTree(['/login'], { queryParams: { next: '/guide' } });
    }),
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return whenReady(auth).pipe(map(() => (auth.isAdmin ? true : router.createUrlTree(['/login']))));
};
