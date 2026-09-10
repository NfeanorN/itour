import { Routes } from '@angular/router';
import { adminGuard, guideGuard } from './core/guards';
import { Admin } from './pages/admin';
import { GuideDetail } from './pages/guide-detail';
import { Guides } from './pages/guides';
import { Home } from './pages/home';
import { Login } from './pages/login';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'guide', component: Guides, canActivate: [guideGuard] },
  { path: 'guide/:slug', component: GuideDetail, canActivate: [guideGuard] },
  { path: 'admin', component: Admin, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' },
];
