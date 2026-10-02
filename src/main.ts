import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Point d'entrée de l'application.
 * bootstrapApplication démarre Angular avec le composant racine App
 * et la configuration (routes, HTTP, interceptors).
 */
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
