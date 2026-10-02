import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user.model';
import { CatalogService } from '../../../core/services/catalog.service';
import { Course } from '../../../core/models/course.model';
import { EnrolledLearner, EnrollmentCandidates, Formation } from '../../../core/models/formation.model';
import { CourseSession } from '../../../core/models/learning.model';
import { RegistrationSettingsService } from '../../../core/services/registration-settings.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-odc-black sm:text-3xl">Gestion des utilisateurs</h1>
      <p class="mt-1 text-sm text-odc-muted">Créer des comptes et gérer leur accès à la plateforme.</p>
    </div>

    @if (feedback()) {
      <div class="card mb-5 border-green-200 bg-green-50 text-green-800" role="status">{{ feedback() }}</div>
    }
    @if (formError()) {
      <div class="card mb-5 border-red-200 bg-red-50 text-red-700" role="alert">{{ formError() }}</div>
    }
    @if (statusError()) {
      <div class="card mb-5 border-red-200 bg-red-50 text-red-700" role="alert">{{ statusError() }}</div>
    }

    <section class="card mb-6" aria-labelledby="public-registration-title">
      <h2 id="public-registration-title" class="text-lg font-semibold text-odc-black">Inscriptions publiques</h2>
      <p class="mt-1 text-sm text-odc-muted">Ce réglage contrôle la création de nouveaux comptes apprenants, y compris avec Google. Les comptes existants pourront toujours se connecter. La création de comptes par un administrateur reste disponible.</p>
      @if (registrationOpen() === null) {
        @if (registrationSettingsLoading()) {
          <p class="mt-3 text-sm text-odc-muted" role="status">Chargement du statut…</p>
        } @else {
          <p class="mt-3 text-sm text-red-700" role="alert">{{ registrationSettingsError() }}</p>
          <button class="btn-secondary mt-3" type="button" (click)="loadRegistrationSettings()">Réessayer</button>
        }
      } @else {
        <p class="mt-3 text-sm font-semibold" [class]="registrationOpen() ? 'text-green-700' : 'text-red-700'">
          {{ registrationOpen() ? 'Actuellement ouvertes' : 'Actuellement fermées' }}
        </p>
        <button class="btn-primary mt-3" type="button" [disabled]="savingRegistrationSettings()" (click)="togglePublicRegistration()">
          {{ savingRegistrationSettings() ? 'Mise à jour…' : (registrationOpen() ? 'Fermer les inscriptions' : 'Ouvrir les inscriptions') }}
        </button>
      }
    </section>

    <section class="card mb-6">
      <h2 class="text-lg font-semibold text-odc-black">Créer un compte</h2>
      <form class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="createUser()">
        <label class="text-sm font-medium">Prénom
          <input class="input-field mt-1" formControlName="prenom" autocomplete="given-name" />
        </label>
        <label class="text-sm font-medium">Nom
          <input class="input-field mt-1" formControlName="nom" autocomplete="family-name" />
        </label>
        <label class="text-sm font-medium">Email
          <input class="input-field mt-1" type="email" formControlName="email" autocomplete="email" />
        </label>
        <label class="text-sm font-medium">Mot de passe (8 caractères minimum)
          <input class="input-field mt-1" type="password" formControlName="password" autocomplete="new-password" />
        </label>
        <label class="text-sm font-medium">Rôle
          <select class="input-field mt-1" formControlName="role">
            <option value="APPRENANT">Apprenant</option>
            <option value="FORMATEUR">Formateur</option>
            <option value="ADMIN">Administrateur</option>
          </select>
        </label>
        <div class="sm:col-span-2">
          <button class="btn-primary" type="submit" [disabled]="form.invalid || creating()">
            {{ creating() ? 'Création…' : 'Créer le compte' }}
          </button>
        </div>
      </form>
    </section>

    <section class="card mb-6" aria-labelledby="enroll-learner-title">
      <h2 id="enroll-learner-title" class="text-lg font-semibold text-odc-black">Gestion des cohortes et inscriptions</h2>
      <p class="mt-1 text-sm text-odc-muted">Une cohorte appartient à une formation et peut regrouper plusieurs cours. Inscrire un apprenant à une cohorte l’inscrit à tous ses cours.</p>
      @if (enrollmentMessage()) {
        <p class="mt-3 text-sm text-green-800" role="status">{{ enrollmentMessage() }}</p>
      }
      @if (enrollmentError()) {
        <p class="mt-3 text-sm text-red-700" role="alert">{{ enrollmentError() }}</p>
      }
      <div class="mt-4 space-y-4" [formGroup]="enrollmentForm">
        <label class="block max-w-xl text-sm font-medium">Formation
          <select class="input-field mt-1" formControlName="formationId" (change)="onFormationChange()">
            <option value="">Choisir une formation</option>
            @for (formation of availableFormations(); track formation.id) {
              <option [value]="formation.id">{{ formation.title }}</option>
            }
          </select>
        </label>
        @if (enrollmentForm.controls.formationId.value) {
          @if (loadingCourseSessions()) {
            <p class="text-sm text-odc-muted" role="status">Chargement des cohortes…</p>
          } @else if (courseSessionsError()) {
            <p class="text-sm text-red-700" role="alert">{{ courseSessionsError() }}</p>
          } @else {
            <label class="block max-w-xl text-sm font-medium">Cohorte
              <select class="input-field mt-1" formControlName="sessionId" (change)="loadSessionCandidates()">
                <option value="">Créer ou choisir une cohorte</option>
                @for (session of courseSessions(); track session.id) {
                  <option [value]="session.id">
                    {{ session.name }} · {{ session.startsAt | date: 'dd/MM/yyyy' }} – {{ session.endsAt | date: 'dd/MM/yyyy' }} · {{ session.courses.length }} cours · {{ session.enrolledCount }} inscription(s)
                  </option>
                }
              </select>
            </label>
            @if (selectedSession(); as selected) {
              <div class="rounded-lg border border-gray-200 p-4">
                <p class="font-bold">{{ selected.name }} · {{ selected.startsAt | date: 'dd/MM/yyyy' }} – {{ selected.endsAt | date: 'dd/MM/yyyy' }}</p>
                <p class="mt-1 text-sm text-odc-muted">Cours de cette cohorte : {{ courseTitles(selected.courses) || 'aucun' }}</p>
                <details class="mt-3">
                  <summary class="cursor-pointer text-sm font-bold text-odc-orange">Ajouter des cours à cette cohorte</summary>
                  @if (coursesToAdd().length) {
                    <div class="mt-2 space-y-1">
                      @for (course of coursesToAdd(); track course.id) {
                        <label class="flex items-center gap-3 py-2 text-sm">
                          <input type="checkbox" class="h-5 w-5 accent-odc-brand-orange" [checked]="selectedCourseIds().includes(course.id)"
                            (change)="toggleCourse(course.id, $any($event.target).checked)" />
                          {{ course.title }}
                        </label>
                      }
                    </div>
                    <button class="btn-secondary mt-3" type="button" (click)="addCoursesToCohort()"
                      [disabled]="!selectedCourseIds().length || savingCourses()">
                      {{ savingCourses() ? 'Ajout…' : 'Ajouter les cours sélectionnés' }}
                    </button>
                  } @else {
                    <p class="mt-2 text-sm text-odc-muted">Tous les cours actifs de cette formation sont déjà dans la cohorte.</p>
                  }
                  @if (sessionFormError()) { <p class="mt-2 text-sm text-red-700" role="alert">{{ sessionFormError() }}</p> }
                </details>
              </div>
            }
            @if (!courseSessions().length) {
              <p class="text-sm text-odc-muted">Aucune cohorte n’est encore planifiée pour cette formation.</p>
            }
            <details>
              <summary class="cursor-pointer text-sm font-bold text-odc-orange">
                {{ courseSessions().length ? 'Créer une autre cohorte' : 'Créer la première cohorte' }}
              </summary>
              <form class="mt-3 grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2" [formGroup]="sessionForm" (ngSubmit)="createSession()">
                <label class="text-sm font-medium sm:col-span-2">Nom de la cohorte
                  <input class="input-field mt-1" formControlName="name" placeholder="Ex. Cohorte développement — octobre 2026" />
                </label>
                <label class="text-sm font-medium">Début
                  <input class="input-field mt-1" type="datetime-local" formControlName="startsAt" />
                </label>
                <label class="text-sm font-medium">Fin
                  <input class="input-field mt-1" type="datetime-local" formControlName="endsAt" />
                </label>
                <div class="sm:col-span-2">
                  <p class="text-sm font-semibold">Cours à inclure (sélectionne-en un ou plusieurs)</p>
                  @if (formationCourses().length) {
                    <div class="mt-2 grid gap-1 sm:grid-cols-2">
                      @for (course of formationCourses(); track course.id) {
                        <label class="flex items-center gap-3 rounded px-2 py-2 text-sm hover:bg-gray-50">
                          <input type="checkbox" class="h-5 w-5 accent-odc-brand-orange" [checked]="selectedCourseIds().includes(course.id)"
                            (change)="toggleCourse(course.id, $any($event.target).checked)" />
                          {{ course.title }}
                        </label>
                      }
                    </div>
                  } @else {
                    <p class="mt-2 text-sm text-odc-muted">Cette formation ne contient aucun cours actif.</p>
                  }
                </div>
                @if (sessionFormError()) { <p class="text-sm text-red-700 sm:col-span-2" role="alert">{{ sessionFormError() }}</p> }
                <div class="sm:col-span-2">
                  <button class="btn-primary" type="submit" [disabled]="sessionForm.invalid || !selectedCourseIds().length || creatingSession()">
                    {{ creatingSession() ? 'Création…' : 'Créer la cohorte et rattacher les cours' }}
                  </button>
                </div>
              </form>
            </details>
          }
        }
        @if (enrollmentForm.controls.sessionId.value) {
          @if (loadingCandidates()) {
            <p class="text-sm text-odc-muted" role="status">Chargement des apprenants…</p>
          } @else if (candidatesError()) {
            <p class="text-sm text-red-700" role="alert">{{ candidatesError() }}</p>
          } @else if (candidates(); as result) {
            <div class="rounded-lg border border-gray-200 p-4">
              <p class="mb-3 text-sm font-bold">{{ selectedSession()?.name }}</p>
              @if (!selectedSession()?.courses?.length) {
                <p class="text-sm text-red-700" role="alert">Ajoute au moins un cours à cette cohorte avant d’inscrire les apprenants.</p>
              } @else {
                <p class="mb-3 text-sm text-odc-muted">Les apprenants sélectionnés seront inscrits à tous les cours de la cohorte : {{ courseTitles(selectedSession()?.courses ?? []) }}.</p>
              <div class="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
                <button type="button" class="rounded-md px-3 py-2 text-sm font-bold"
                  [class.bg-black]="learnerView() === 'available'" [class.text-white]="learnerView() === 'available'"
                  [class.bg-gray-100]="learnerView() !== 'available'" (click)="learnerView.set('available')">
                  À inscrire ({{ result.learners.length }})
                </button>
                <button type="button" class="rounded-md px-3 py-2 text-sm font-bold"
                  [class.bg-black]="learnerView() === 'enrolled'" [class.text-white]="learnerView() === 'enrolled'"
                  [class.bg-gray-100]="learnerView() !== 'enrolled'" (click)="learnerView.set('enrolled')">
                  Déjà inscrits ({{ result.enrolledCount }})
                </button>
              </div>
              <label class="mt-4 block max-w-xl text-sm font-semibold">
                Rechercher par nom, prénom ou e-mail
                <input class="input-field mt-1" type="search" [value]="learnerSearch()"
                  (input)="learnerSearch.set($any($event.target).value)" placeholder="Ex. Awa, Diallo ou email@exemple.com" />
              </label>
              @if (learnerView() === 'available') {
                @if (result.enrolledCount === 0) {
                  <p class="mt-3 text-sm text-odc-muted">Aucun apprenant n’est encore inscrit à cette session. Tous les apprenants actifs sont proposés.</p>
                }
                @if (result.learners.length) {
                  <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p class="text-sm font-semibold">{{ selectedLearnerIds().length }} sélectionné(s) · {{ visibleCandidates().length }} résultat(s)</p>
                    @if (visibleCandidates().length) {
                      <button class="btn-secondary text-sm" type="button" (click)="toggleVisibleLearners()">
                        {{ allVisibleSelected() ? 'Désélectionner les résultats' : 'Sélectionner les résultats' }}
                      </button>
                    }
                  </div>
                  @if (visibleCandidates().length) {
                    <div class="mt-2 divide-y divide-gray-100">
                      @for (learner of visibleCandidates(); track learner.id) {
                        <label class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-3 text-sm hover:bg-gray-50">
                          <input type="checkbox" class="h-5 w-5 shrink-0 accent-odc-brand-orange"
                            [checked]="selectedLearnerIds().includes(learner.id)"
                            (change)="toggleLearner(learner.id, $any($event.target).checked)" />
                          <span class="min-w-0"><span class="block font-semibold">{{ learner.prenom }} {{ learner.nom }}</span>
                            <span class="block break-all text-odc-muted">{{ learner.email }}</span></span>
                        </label>
                      }
                    </div>
                  } @else {
                    <p class="mt-3 text-sm text-odc-muted">Aucun apprenant ne correspond à cette recherche.</p>
                  }
                } @else {
                  <p class="mt-3 text-sm text-odc-muted">Tous les apprenants actifs sont déjà inscrits à cette session.</p>
                }
                <button class="btn-primary mt-4" type="button" (click)="enrollLearners()"
                  [disabled]="!selectedLearnerIds().length || enrollingLearners()">
                  {{ enrollingLearners() ? 'Inscription…' : 'Inscrire les apprenants sélectionnés (' + selectedLearnerIds().length + ')' }}
                </button>
              } @else if (visibleEnrolledLearners().length) {
                <div class="mt-3 divide-y divide-gray-100">
                  @for (enrollment of visibleEnrolledLearners(); track enrollment.learner.id) {
                    <div class="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                      <div><p class="font-semibold">{{ enrollment.learner.prenom }} {{ enrollment.learner.nom }}</p>
                        <p class="break-all text-odc-muted">{{ enrollment.learner.email }}</p></div>
                      <span class="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">{{ enrollment.status === 'ACTIVE' ? 'Inscrit' : enrollment.status }}</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="mt-3 text-sm text-odc-muted">{{ result.enrolledCount ? 'Aucun inscrit ne correspond à cette recherche.' : 'Aucun apprenant n’est encore inscrit à cette session.' }}</p>
              }
              }
            </div>
          }
        }
      </div>
      @if (!availableFormations().length) { <p class="mt-3 text-sm text-odc-muted">Aucune formation active avec des cours disponibles.</p> }
    </section>

    <section class="card">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-odc-black">Comptes utilisateurs</h2>
          <p class="text-sm text-odc-muted">{{ filteredUsers().length }} résultat(s) sur {{ users().length }} compte(s)</p>
        </div>
        <button class="btn-secondary" type="button" (click)="loadUsers()" [disabled]="loading()">
          {{ loading() ? 'Chargement…' : 'Actualiser' }}
        </button>
      </div>
      <label class="mb-4 block max-w-xl text-sm font-semibold" for="admin-user-search">
        Rechercher un apprenant, un formateur ou un compte
        <input id="admin-user-search" class="input-field mt-2" type="search" [value]="userSearch()"
          (input)="userSearch.set(($any($event.target)).value)" placeholder="Nom, prénom, e-mail ou rôle…" />
      </label>

      @if (loadError()) {
        <p class="text-sm text-red-700" role="alert">{{ loadError() }}</p>
      } @else if (loading()) {
        <p class="text-sm text-odc-muted">Chargement des utilisateurs…</p>
      } @else if (users().length === 0) {
        <p class="text-sm text-odc-muted">Aucun utilisateur à afficher.</p>
      } @else if (filteredUsers().length === 0) {
        <p class="text-sm text-odc-muted">Aucun compte ne correspond à cette recherche.</p>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-sm">
            <thead class="border-b border-gray-200 text-xs uppercase text-odc-muted">
              <tr><th class="py-3 pr-4">Nom</th><th class="py-3 pr-4">Email</th><th class="py-3 pr-4">Rôle</th><th class="py-3 pr-4">Statut</th><th class="py-3 pr-4">Créé le</th><th class="py-3">Action</th></tr>
            </thead>
            <tbody>
              @for (user of filteredUsers(); track user.id) {
                <tr class="border-b border-gray-100 last:border-0">
                  <td class="py-3 pr-4 font-medium">{{ user.prenom }} {{ user.nom }}</td>
                  <td class="py-3 pr-4">{{ user.email }}</td>
                  <td class="py-3 pr-4">{{ user.role }}</td>
                  <td class="py-3 pr-4">{{ user.active ? 'Actif' : 'Inactif' }}</td>
                  <td class="py-3 pr-4">{{ user.createdAt ? (user.createdAt | date: 'mediumDate') : '—' }}</td>
                  <td class="py-3">
                    <button type="button" class="btn-secondary text-xs" [disabled]="pendingUserIds().includes(user.id)"
                      (click)="toggleUserStatus(user)">
                      {{ pendingUserIds().includes(user.id) ? 'Mise à jour…' : (user.active ? 'Désactiver' : 'Activer') }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly admin = inject(AdminService);
  private readonly catalog = inject(CatalogService);
  private readonly registrationSettings = inject(RegistrationSettingsService);

  readonly form = this.fb.nonNullable.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: this.fb.control<'ADMIN' | 'APPRENANT' | 'FORMATEUR'>('APPRENANT', { nonNullable: true }),
  });
  readonly users = signal<User[]>([]);
  readonly userSearch = signal('');
  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly feedback = signal<string | null>(null);
  readonly statusError = signal<string | null>(null);
  readonly pendingUserIds = signal<number[]>([]);
  readonly registrationOpen = signal<boolean | null>(null);
  readonly registrationSettingsLoading = signal(true);
  readonly savingRegistrationSettings = signal(false);
  readonly registrationSettingsError = signal<string | null>(null);
  readonly courses = signal<Course[]>([]);
  readonly formations = signal<Formation[]>([]);
  readonly courseSessions = signal<CourseSession[]>([]);
  readonly loadingCourseSessions = signal(false);
  readonly courseSessionsError = signal<string | null>(null);
  readonly creatingSession = signal(false);
  readonly savingCourses = signal(false);
  readonly sessionFormError = signal<string | null>(null);
  readonly candidates = signal<EnrollmentCandidates | null>(null);
  readonly selectedLearnerIds = signal<number[]>([]);
  readonly learnerSearch = signal('');
  readonly learnerView = signal<'available' | 'enrolled'>('available');
  readonly loadingCandidates = signal(false);
  readonly enrollingLearners = signal(false);
  readonly enrollmentMessage = signal<string | null>(null);
  readonly enrollmentError = signal<string | null>(null);
  readonly candidatesError = signal<string | null>(null);
  readonly enrollmentForm = this.fb.nonNullable.group({
    formationId: [''],
    sessionId: ['', Validators.required],
  });
  readonly selectedCourseIds = signal<number[]>([]);
  readonly sessionForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    startsAt: ['', Validators.required],
    endsAt: ['', Validators.required],
  });

  filteredUsers(): User[] {
    const query = this.normalize(this.userSearch());
    if (!query) return this.users();
    return this.users().filter((user) => {
      const roleLabel = user.role === 'APPRENANT' ? 'apprenant' : user.role === 'FORMATEUR' ? 'formateur' : 'administrateur';
      return this.normalize(`${user.prenom} ${user.nom} ${user.email} ${user.role} ${roleLabel}`).includes(query);
    });
  }

  availableCourses(): Course[] {
    return this.courses().filter((course) => course.active);
  }

  availableFormations(): Formation[] {
    const formationIds = new Set(this.availableCourses().map((course) => course.formationId));
    return this.formations().filter((formation) => formation.active && formationIds.has(formation.id));
  }

  formationCourses(): Course[] {
    const formationId = Number(this.enrollmentForm.controls.formationId.value);
    return this.availableCourses()
      .filter((course) => course.formationId === formationId)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  coursesToAdd(): Course[] {
    const attachedIds = new Set(this.selectedSession()?.courses.map((course) => course.id) ?? []);
    return this.formationCourses().filter((course) => !attachedIds.has(course.id));
  }

  selectedSession(): CourseSession | undefined {
    const sessionId = Number(this.enrollmentForm.controls.sessionId.value);
    return this.courseSessions().find((session) => session.id === sessionId);
  }

  courseTitles(courses: { id: number; title: string }[]): string {
    return courses.map((course) => course.title).join(', ');
  }

  visibleCandidates(): User[] {
    const query = this.normalize(this.learnerSearch());
    return (this.candidates()?.learners ?? []).filter((learner) =>
      this.normalize(`${learner.prenom} ${learner.nom} ${learner.email}`).includes(query));
  }

  visibleEnrolledLearners(): EnrolledLearner[] {
    const query = this.normalize(this.learnerSearch());
    return (this.candidates()?.enrolledLearners ?? []).filter(({ learner }) =>
      this.normalize(`${learner.prenom} ${learner.nom} ${learner.email}`).includes(query));
  }

  allVisibleSelected(): boolean {
    const visible = this.visibleCandidates();
    return visible.length > 0 && visible.every((learner) => this.selectedLearnerIds().includes(learner.id));
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRegistrationSettings();
    this.catalog.getCourses().subscribe({
      next: (courses) => this.courses.set(courses),
      error: (error) => this.enrollmentError.set(this.apiMessage(error, 'Impossible de charger les cours.')),
    });
    this.catalog.getFormations().subscribe({
      next: (formations) => this.formations.set(formations),
      error: (error) => this.enrollmentError.set(this.apiMessage(error, 'Impossible de charger les formations.')),
    });
  }

  loadRegistrationSettings(): void {
    this.registrationSettingsLoading.set(true);
    this.registrationSettingsError.set(null);
    this.registrationSettings.getStatus().subscribe({
      next: (status) => {
        this.registrationOpen.set(status.open);
        this.registrationSettingsLoading.set(false);
      },
      error: (error) => {
        this.registrationSettingsError.set(this.apiMessage(error, 'Impossible de charger le statut des inscriptions.'));
        this.registrationSettingsLoading.set(false);
      },
    });
  }

  togglePublicRegistration(): void {
    const current = this.registrationOpen();
    if (current === null || this.savingRegistrationSettings()) return;
    this.savingRegistrationSettings.set(true);
    this.registrationSettingsError.set(null);
    this.registrationSettings.setOpen(!current).subscribe({
      next: (status) => {
        this.registrationOpen.set(status.open);
        this.savingRegistrationSettings.set(false);
        this.feedback.set(status.open ? 'Les inscriptions publiques sont ouvertes.' : 'Les inscriptions publiques sont fermées.');
      },
      error: (error) => {
        this.registrationSettingsError.set(this.apiMessage(error, 'Impossible de modifier le statut des inscriptions.'));
        this.savingRegistrationSettings.set(false);
      },
    });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.admin.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        this.loadError.set(this.apiMessage(error, 'Impossible de charger les utilisateurs.'));
        this.loading.set(false);
      },
    });
  }

  createUser(): void {
    if (this.form.invalid || this.creating()) {
      this.form.markAllAsTouched();
      return;
    }
    this.creating.set(true);
    this.formError.set(null);
    this.feedback.set(null);
    const request = this.form.getRawValue();
    this.admin.createUser({ ...request, email: request.email.trim() }).subscribe({
      next: () => {
        this.creating.set(false);
        this.feedback.set(`Compte ${request.role === 'ADMIN' ? 'administrateur' : request.role === 'FORMATEUR' ? 'formateur' : 'apprenant'} créé avec succès.`);
        this.form.reset();
        this.loadUsers();
      },
      error: (error) => {
        this.creating.set(false);
        this.formError.set(this.apiMessage(error, 'Impossible de créer ce compte.'));
      },
    });
  }

  toggleUserStatus(user: User): void {
    const active = !user.active;
    this.statusError.set(null);
    this.pendingUserIds.update((ids) => [...ids, user.id]);
    this.admin.setUserActive(user.id, active).subscribe({
      next: (updated) => {
        this.users.update((users) => users.map((item) => item.id === updated.id ? updated : item));
        this.pendingUserIds.update((ids) => ids.filter((id) => id !== user.id));
      },
      error: (error) => {
        this.statusError.set(this.apiMessage(error, 'Impossible de modifier le statut du compte.'));
        this.pendingUserIds.update((ids) => ids.filter((id) => id !== user.id));
      },
    });
  }

  loadFormationSessions(): void {
    const formationId = Number(this.enrollmentForm.controls.formationId.value);
    this.courseSessions.set([]);
    this.candidates.set(null);
    this.enrollmentForm.controls.sessionId.setValue('');
    this.selectedLearnerIds.set([]);
    this.selectedCourseIds.set([]);
    this.learnerSearch.set('');
    this.learnerView.set('available');
    this.enrollmentMessage.set(null);
    this.enrollmentError.set(null);
    this.candidatesError.set(null);
    this.courseSessionsError.set(null);
    if (!Number.isInteger(formationId) || formationId <= 0) return;
    this.loadingCourseSessions.set(true);
    this.catalog.getFormationSessions(formationId).subscribe({
      next: (sessions) => {
        this.courseSessions.set(sessions);
        this.loadingCourseSessions.set(false);
      },
      error: (error) => {
        this.courseSessionsError.set(this.apiMessage(error, 'Impossible de charger les cohortes de cette formation.'));
        this.loadingCourseSessions.set(false);
      },
    });
  }

  loadSessionCandidates(clearMessage = true): void {
    const sessionId = Number(this.enrollmentForm.controls.sessionId.value);
    this.candidates.set(null);
    this.selectedLearnerIds.set([]);
    this.learnerSearch.set('');
    if (clearMessage) this.learnerView.set('available');
    if (clearMessage) this.enrollmentMessage.set(null);
    this.enrollmentError.set(null);
    this.candidatesError.set(null);
    this.selectedCourseIds.set([]);
    if (!Number.isInteger(sessionId) || sessionId <= 0) return;
    this.loadingCandidates.set(true);
    this.catalog.getSessionEnrollmentCandidates(sessionId).subscribe({
      next: (candidates) => {
        this.candidates.set(candidates);
        this.loadingCandidates.set(false);
      },
      error: (error) => {
        this.candidatesError.set(this.apiMessage(error, 'Impossible de charger les apprenants disponibles.'));
        this.loadingCandidates.set(false);
      },
    });
  }

  createSession(): void {
    if (this.sessionForm.invalid || this.creatingSession()) {
      this.sessionForm.markAllAsTouched();
      return;
    }
    const { name, startsAt, endsAt } = this.sessionForm.getRawValue();
    if (new Date(endsAt) <= new Date(startsAt)) {
      this.sessionFormError.set('La date de fin doit être postérieure à la date de début.');
      return;
    }
    const formationId = Number(this.enrollmentForm.controls.formationId.value);
    if (!Number.isInteger(formationId) || formationId <= 0 || !this.selectedCourseIds().length) return;
    this.creatingSession.set(true);
    this.sessionFormError.set(null);
    this.catalog.createFormationSession(formationId, {
      name,
      startsAt,
      endsAt,
      courseIds: this.selectedCourseIds(),
    }).subscribe({
      next: (session) => {
        this.courseSessions.update((sessions) => [...sessions, session].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
        this.enrollmentForm.controls.sessionId.setValue(String(session.id));
        this.selectedCourseIds.set([]);
        this.sessionForm.reset();
        this.creatingSession.set(false);
        this.loadSessionCandidates();
      },
      error: (error) => {
        this.sessionFormError.set(this.apiMessage(error, 'Impossible de planifier cette session.'));
        this.creatingSession.set(false);
      },
    });
  }

  addCoursesToCohort(): void {
    const session = this.selectedSession();
    if (!session || !this.selectedCourseIds().length || this.savingCourses()) return;
    this.savingCourses.set(true);
    this.sessionFormError.set(null);
    this.catalog.addCoursesToSession(session.id, this.selectedCourseIds()).subscribe({
      next: (updated) => {
        this.courseSessions.update((sessions) => sessions.map((item) => item.id === updated.id ? updated : item));
        this.selectedCourseIds.set([]);
        this.savingCourses.set(false);
        this.loadSessionCandidates(false);
      },
      error: (error) => {
        this.sessionFormError.set(this.apiMessage(error, 'Impossible d’ajouter les cours à cette cohorte.'));
        this.savingCourses.set(false);
      },
    });
  }

  toggleCourse(courseId: number, selected: boolean): void {
    this.selectedCourseIds.update((ids) => selected
      ? ids.includes(courseId) ? ids : [...ids, courseId]
      : ids.filter((id) => id !== courseId));
  }

  onFormationChange(): void {
    this.candidates.set(null);
    this.selectedLearnerIds.set([]);
    this.sessionFormError.set(null);
    this.loadFormationSessions();
  }

  toggleVisibleLearners(): void {
    const visible = this.visibleCandidates().map((learner) => learner.id);
    if (this.allVisibleSelected()) {
      this.selectedLearnerIds.update((ids) => ids.filter((id) => !visible.includes(id)));
    } else {
      this.selectedLearnerIds.update((ids) => [...new Set([...ids, ...visible])]);
    }
  }

  toggleLearner(userId: number, selected: boolean): void {
    this.selectedLearnerIds.update((ids) => selected
      ? ids.includes(userId) ? ids : [...ids, userId]
      : ids.filter((id) => id !== userId));
  }

  enrollLearners(): void {
    if (this.enrollmentForm.invalid || this.enrollingLearners() || !this.selectedLearnerIds().length) return;
    const sessionId = Number(this.enrollmentForm.controls.sessionId.value);
    if (!Number.isInteger(sessionId)) return;
    this.enrollingLearners.set(true);
    this.enrollmentError.set(null);
    this.enrollmentMessage.set(null);
    this.catalog.enrollLearnersToSession(sessionId, this.selectedLearnerIds()).subscribe({
      next: (result) => {
        const session = this.courseSessions().find((item) => item.id === sessionId);
        const title = session?.name ?? 'session';
        this.selectedLearnerIds.set([]);
        this.enrollmentMessage.set(`${result.enrolledCount} apprenant(s) inscrit(s) à « ${title} ». ${result.alreadyEnrolledCount} déjà inscrit(s).`);
        this.enrollingLearners.set(false);
        this.loadSessionCandidates(false);
        this.learnerView.set('enrolled');
        const formationId = Number(this.enrollmentForm.controls.formationId.value);
        this.catalog.getFormationSessions(formationId).subscribe({
          next: (sessions) => this.courseSessions.set(sessions),
          error: (error) => this.courseSessionsError.set(this.apiMessage(error, 'Impossible d’actualiser les cohortes de la formation.')),
        });
      },
      error: (error) => {
        this.enrollmentError.set(this.apiMessage(error, 'Impossible d’inscrire les apprenants sélectionnés.'));
        this.enrollingLearners.set(false);
      },
    });
  }

  private apiMessage(error: any, fallback: string): string {
    if (error?.error?.details?.length) return error.error.details.join(' ');
    if (error?.error?.message) return error.error.message;
    if (error?.status === 0) return 'Le serveur API est inaccessible. Vérifiez que le backend est démarré.';
    if (error?.status === 401) return 'Votre session a expiré. Reconnectez-vous en administrateur.';
    if (error?.status === 403) return 'Votre compte ne dispose pas des droits administrateur.';
    return fallback;
  }

  private normalize(value: string): string {
    return value.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
}
