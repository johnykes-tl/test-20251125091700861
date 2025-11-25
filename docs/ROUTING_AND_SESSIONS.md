# Arhitectura de Rutare și Managementul Sesiunii

Acest document descrie arhitectura fundamentală care stă la baza sistemului de rutare și a managementului sesiunilor de utilizator în cadrul platformei.

## Prezentare Generală

Sistemul este construit în jurul a două concepte cheie care colaborează pentru a oferi o experiență sigură și fluidă:

1.  **Păstrătorul Sesiunii (`AuthContext`)**: Nucleul sistemului de autentificare, responsabil pentru menținerea stării utilizatorului.
2.  **Paznicul Rutelor (`RouteGuard`)**: Un filtru de securitate care protejează fiecare pagină și controlează accesul pe bază de rol.

---

## 1. Păstrătorul Sesiunii (`AuthContext`)

`AuthContext` este un React Context care încapsulează toată logica legată de autentificare. Acesta face starea utilizatorului (dacă este conectat, ce rol are etc.) disponibilă în întreaga aplicație.

### Responsabilități Principale:

-   **Comunicarea cu Furnizorul de Autentificare**: Interacționează direct cu Supabase pentru a valida acreditările (`signIn`), a încheia sesiunea (`signOut`) și a monitoriza schimbările de stare a autentificării.
-   **Stocarea Stării Utilizatorului**: Păstrează informații esențiale despre utilizatorul conectat, cum ar fi `id`, `email` și, cel mai important, `rol` (`admin` sau `employee`).
-   **Notificarea Aplicației**: Orice componentă din aplicație se poate abona la acest context și poate reacționa instantaneu la schimbările de stare (ex: un utilizator se conectează sau se deconectează).
-   **Reîmprospătarea Proactivă a Sesiunii**: Pentru a preveni deconectarea la inactivitate, contextul inițiază un proces automat care, la intervale regulate (ex: 15 minute), verifică și reîmprospătează token-ul de sesiune. Acest mecanism asigură că sesiunea rămâne activă atâta timp cât utilizatorul are aplicația deschisă, eliminând erorile de tip "sesiune expirată".
### Exemplu de Utilizare:

```tsx
// În orice componentă care are nevoie de informații despre utilizator
import { useAuth } from '../contexts/AuthContext';

function UserProfile() {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <p>Nu sunteți conectat.</p>;
  }

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>Rol: {isAdmin ? 'Administrator' : 'Angajat'}</p>
    </div>
  );
}
```

---

## 2. Paznicul Rutelor (`RouteGuard`)

Componenta `RouteGuard` este un "Higher-Order Component" care încapsulează întreaga structură de rute a aplicației. Rolul său este de a acționa ca un punct de control de securitate.

### Procesul de Funcționare:

1.  **Interceptarea Navigării**: Când un utilizator încearcă să acceseze o nouă rută (ex: `/admin/dashboard`), `RouteGuard` este prima componentă care procesează cererea.
2.  **Consultarea Stării Sesiunii**: `RouteGuard` folosește hook-ul `useAuth()` pentru a obține starea curentă a utilizatorului de la `AuthContext`.
3.  **Aplicarea Regulilor de Acces**: Pe baza stării utilizatorului și a rutei solicitate, se aplică un set de reguli:
    -   **Rute Publice** (ex: `/` - pagina de login):
        -   Dacă utilizatorul **nu** este conectat, permite accesul.
        -   Dacă utilizatorul **este** conectat, îl redirecționează automat către dashboard-ul corespunzător rolului său (ex: `/admin/dashboard` sau `/employee/timesheet`).
    -   **Rute Protejate de Admin** (ex: `/admin/*`):
        -   Dacă utilizatorul **nu** este conectat, îl redirecționează la pagina de login.
        -   Dacă utilizatorul este conectat, dar **nu** are rolul `admin`, îl redirecționează către pagina sa de angajat.
        -   Dacă utilizatorul este `admin`, permite accesul.
    -   **Rute Protejate de Angajat** (ex: `/employee/*`):
        -   Dacă utilizatorul **nu** este conectat, îl redirecționează la pagina de login.
        -   Dacă utilizatorul este conectat, dar **nu** are rolul `employee` (este admin), îl redirecționează către dashboard-ul de admin.
        -   Dacă utilizatorul este `employee`, permite accesul.
4.  **Redare Condiționată**: Doar dacă toate condițiile de acces sunt îndeplinite, `RouteGuard` va reda componenta copil (pagina solicitată). În caz contrar, afișează un ecran de încărcare în timpul redirecționării.

---

## 3. Monitorul de Conexiune (`connectionMonitor`)

Pentru a rezolva problema pierderii sesiunii la inactivitate, a fost adăugat un nou utilitar, `connectionMonitor`.

### Responsabilități:

-   **Monitorizarea Stării Online/Offline**: Detectează instantaneu dacă browser-ul pierde conexiunea la internet.
-   **Verificarea Sănătății Conexiunii**: La intervale regulate, trimite o cerere discretă către un endpoint de "health-check" al serverului pentru a măsura latența și a confirma că backend-ul este accesibil.
-   **Furnizarea Stării Globale**: Expune starea conexiunii (`isOnline`, `isHealthy`, `latency`) printr-un context global (`ConnectionStateProvider`), disponibil în întreaga aplicație.

AAcest monitor este complementar cu mecanismul de reîmprospătare a sesiunii. În timp ce `AuthContext` menține sesiunea *validă*, `connectionMonitor` asigură că există o conexiune *fizică* la server, permițând aplicației să distingă între o problemă de rețea și o problemă de autentificare.