import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Composant racine.
 * Il se contente d'afficher le router-outlet :
 * les layouts (auth / main) gèrent l'habillage des pages.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {}
