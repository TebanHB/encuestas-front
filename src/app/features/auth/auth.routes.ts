import { Routes } from '@angular/router';
import { Access } from './pages/access';
import { Login } from './pages/login';
import { Error } from './pages/error';

export default [
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: 'login', component: Login }
] as Routes;

