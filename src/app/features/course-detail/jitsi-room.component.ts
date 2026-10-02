import { Component, ElementRef, effect, inject, input, signal, viewChild } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

interface JitsiMeetApi {
  dispose(): void;
}

interface JitsiMeetOptions {
  roomName: string;
  parentNode: HTMLElement;
  width: string;
  height: string;
  userInfo: { displayName: string };
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: JitsiMeetOptions) => JitsiMeetApi;
  }
}

let apiDomain: string | null = null;
let apiLoading: Promise<void> | null = null;

function loadJitsiApi(domain: string): Promise<void> {
  if (window.JitsiMeetExternalAPI && apiDomain === domain) return Promise.resolve();
  if (apiLoading && apiDomain === domain) return apiLoading;

  apiDomain = domain;
  apiLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => window.JitsiMeetExternalAPI
      ? resolve()
      : reject(new Error('L’API Jitsi n’a pas été initialisée.'));
    script.onerror = () => {
      apiLoading = null;
      apiDomain = null;
      reject(new Error('Impossible de charger l’API Jitsi.'));
    };
    document.head.appendChild(script);
  });
  return apiLoading;
}

@Component({
  selector: 'app-jitsi-room',
  standalone: true,
  template: `
    <div #host class="mt-3 h-[28rem] w-full rounded-lg border border-gray-300" aria-label="Salle de visioconférence"></div>
    @if (error()) { <p class="mt-2 text-sm text-red-700" role="alert">{{ error() }}</p> }
  `,
})
export class JitsiRoomComponent {
  readonly roomName = input.required<string>();
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private readonly auth = inject(AuthService);
  readonly error = signal<string | null>(null);
  private api: JitsiMeetApi | null = null;
  private generation = 0;

  private readonly joinRoom = effect(() => {
    const roomName = this.roomName();
    const displayName = this.auth.displayName();
    void this.mount(roomName, displayName);
  });

  private async mount(roomName: string, displayName: string): Promise<void> {
    const generation = ++this.generation;
    this.api?.dispose();
    this.api = null;
    this.error.set(null);
    try {
      await loadJitsiApi(environment.jitsiDomain);
      if (generation !== this.generation) return;
      const JitsiApi = window.JitsiMeetExternalAPI;
      if (!JitsiApi) throw new Error('L’API Jitsi n’est pas disponible.');
      this.api = new JitsiApi(environment.jitsiDomain, {
        roomName,
        parentNode: this.host().nativeElement,
        width: '100%',
        height: '100%',
        userInfo: { displayName },
      });
    } catch (error) {
      if (generation === this.generation) {
        this.error.set(error instanceof Error ? error.message : 'Impossible de rejoindre la salle Jitsi.');
      }
    }
  }

  ngOnDestroy(): void {
    this.generation++;
    this.api?.dispose();
  }
}
