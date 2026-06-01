# Requirements Document

## Introduction

This feature adds a dedicated employee login screen to the LabConnect medical lab mobile app (React Native + Expo). The screen is part of a role-based authentication flow where a role selector screen routes employees to their own login page. The employee login screen collects a phone number and password, validates them locally, authenticates against the API, enforces the `employee` role, persists the session via SecureStore, and navigates to the employee portal. It also introduces a role selector screen that replaces the existing generic login screen, and updates the app entry point to redirect users by role on launch.

## Glossary

- **LoginScreen**: The employee-specific login screen at `app/(auth)/employee-login.tsx`
- **RoleSelectorScreen**: The role selection screen at `app/(auth)/login.tsx` that presents Patient, Employee, and Admin login cards
- **IndexScreen**: The app entry point at `app/index.tsx` that bootstraps the session and redirects by role
- **AuthStore**: The Zustand store at `src/store/auth-store.ts` that manages token, user, and hydration state
- **SecureStore**: The `expo-secure-store` library used to persist the JWT token and user data
- **API**: The backend REST API accessed via `EXPO_PUBLIC_API_URL`
- **PhoneInput**: The phone number text input field in the LoginScreen
- **PasswordInput**: The password text input field in the LoginScreen
- **ErrorBanner**: The dismissible red error banner displayed at the top of the LoginScreen
- **LoginButton**: The full-width submit button in the LoginScreen

---

## Requirements

### Requirement 1: Role Selector Screen

**User Story:** As a user launching the app for the first time (unauthenticated), I want to see a role selection screen, so that I can choose whether to log in as a Patient, Employee, or Admin.

#### Acceptance Criteria

1. THE RoleSelectorScreen SHALL display three tappable role cards: Patient, Employee, and Admin.
2. WHEN the Patient card is tapped, THE RoleSelectorScreen SHALL navigate to the patient login route.
3. WHEN the Employee card is tapped, THE RoleSelectorScreen SHALL navigate to `/(auth)/employee-login`.
4. WHEN the Admin card is tapped, THE RoleSelectorScreen SHALL navigate to the admin login route.
5. THE RoleSelectorScreen SHALL display a logo, an "Employee Portal" label, a "Welcome Back" heading, and a "Sign in to your account" subheading within the employee card context — or a general portal heading at the top level.

---

### Requirement 2: Employee Login Screen Layout

**User Story:** As an employee, I want a clearly structured login screen, so that I can quickly identify the form fields and submit my credentials.

#### Acceptance Criteria

1. THE LoginScreen SHALL display a logo image at the top of the screen.
2. THE LoginScreen SHALL display the label "Employee Portal" below the logo.
3. THE LoginScreen SHALL display the heading "Welcome Back" below the label.
4. THE LoginScreen SHALL display the subheading "Sign in to your account" below the heading.
5. THE LoginScreen SHALL display a PhoneInput field with a phone icon on the left.
6. THE LoginScreen SHALL display a PasswordInput field with a lock icon on the left.
7. THE LoginScreen SHALL display a "Forgot Password?" link aligned to the right of the form.
8. THE LoginScreen SHALL display a full-width LoginButton with the background color `#0F6E56`.
9. THE LoginScreen SHALL display a "Having trouble? Contact your admin" text and the app version at the bottom of the screen.
10. THE LoginScreen SHALL use `KeyboardAvoidingView` wrapping a `ScrollView` to prevent the keyboard from obscuring the form.

---

### Requirement 3: Form Input Behavior

**User Story:** As an employee, I want the input fields to behave correctly for phone and password entry, so that I can enter my credentials efficiently.

#### Acceptance Criteria

1. THE PhoneInput SHALL use a numeric keyboard type and accept a maximum of 10 digits.
2. THE PasswordInput SHALL obscure entered text by default.
3. THE PasswordInput SHALL display a toggle eye icon that, when tapped, reveals or hides the password text.
4. WHEN the return key is pressed on the PhoneInput, THE LoginScreen SHALL move focus to the PasswordInput.
5. WHEN the return key is pressed on the PasswordInput, THE LoginScreen SHALL trigger the login action.

---

### Requirement 4: Client-Side Validation

**User Story:** As an employee, I want to see inline error messages when I submit incomplete or invalid credentials, so that I know exactly what to fix before the request is sent.

#### Acceptance Criteria

1. WHEN the LoginButton is pressed and the phone field is empty, THE LoginScreen SHALL display the inline error "Phone number is required" below the PhoneInput.
2. WHEN the LoginButton is pressed and the password field is empty, THE LoginScreen SHALL display the inline error "Password is required" below the PasswordInput.
3. WHEN the LoginButton is pressed and the phone field contains fewer than 10 digits, THE LoginScreen SHALL display the inline error "Phone number must be 10 digits" below the PhoneInput.
4. IF a validation error is present, THEN THE LoginScreen SHALL not send a network request.
5. WHEN the user modifies the PhoneInput after a validation error, THE LoginScreen SHALL clear the phone inline error.
6. WHEN the user modifies the PasswordInput after a validation error, THE LoginScreen SHALL clear the password inline error.

---

### Requirement 5: Login API Request

**User Story:** As an employee, I want my credentials to be sent to the server securely, so that I can be authenticated.

#### Acceptance Criteria

1. WHEN the LoginButton is pressed and all fields are valid, THE LoginScreen SHALL send a POST request to `${EXPO_PUBLIC_API_URL}/auth/login` with the body `{ phone, password }`.
2. WHILE the request is in flight, THE LoginButton SHALL display an `ActivityIndicator` instead of the button label.
3. WHILE the request is in flight, THE LoginButton SHALL be disabled.
4. THE LoginScreen SHALL reset the loading state after the request completes, regardless of success or failure.

---

### Requirement 6: Successful Login and Role Enforcement

**User Story:** As an employee, I want to be redirected to the employee portal after a successful login, so that I can access my work dashboard.

#### Acceptance Criteria

1. WHEN the API returns a successful response, THE LoginScreen SHALL verify that `user.role === 'employee'`.
2. WHEN `user.role === 'employee'`, THE LoginScreen SHALL save the access token, role, and user ID to SecureStore via the AuthStore `setSession` method.
3. WHEN `user.role === 'employee'`, THE LoginScreen SHALL navigate to `/(employee)`.
4. WHEN the API returns a successful response but `user.role` is not `'employee'`, THE LoginScreen SHALL display the ErrorBanner with the message "Access denied. This portal is for employees only."

---

### Requirement 7: API Error Handling

**User Story:** As an employee, I want to see a clear error message when login fails, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN the API returns a 401 status, THE LoginScreen SHALL display the ErrorBanner with the message "Incorrect phone number or password."
2. WHEN the API returns a 403 status, THE LoginScreen SHALL display the ErrorBanner with the message "Your account has been deactivated. Contact admin."
3. WHEN a network error occurs (no internet connection), THE LoginScreen SHALL display the ErrorBanner with the message "No internet connection. Please try again."
4. WHEN any other API error occurs, THE LoginScreen SHALL display the ErrorBanner with the API error message or a generic fallback message.

---

### Requirement 8: Error Banner Behavior

**User Story:** As an employee, I want to be able to dismiss error messages, so that the screen is not permanently cluttered after I acknowledge an error.

#### Acceptance Criteria

1. THE ErrorBanner SHALL be displayed with a red background (`#EF4444`) at the top of the form area.
2. THE ErrorBanner SHALL display a dismiss button (X icon) on the right side.
3. WHEN the dismiss button is tapped, THE LoginScreen SHALL hide the ErrorBanner.
4. WHEN a new login attempt is initiated, THE LoginScreen SHALL clear any previously displayed ErrorBanner.

---

### Requirement 9: App Entry Point Role-Based Redirect

**User Story:** As a returning user, I want the app to automatically redirect me to the correct portal on launch based on my saved session, so that I do not have to log in again.

#### Acceptance Criteria

1. WHEN the app launches, THE IndexScreen SHALL call the AuthStore `bootstrap` method to hydrate the session from SecureStore.
2. WHILE the session is being hydrated, THE IndexScreen SHALL display a loading indicator.
3. WHEN hydration is complete and no session exists, THE IndexScreen SHALL redirect to `/(auth)/login`.
4. WHEN hydration is complete and `user.role === 'admin'`, THE IndexScreen SHALL redirect to `/(admin)`.
5. WHEN hydration is complete and `user.role === 'employee'`, THE IndexScreen SHALL redirect to `/(employee)`.
6. WHEN hydration is complete and `user.role === 'patient'`, THE IndexScreen SHALL redirect to `/(patient)`.

---

### Requirement 10: Auth Layout

**User Story:** As a developer, I want the auth route group to have a Stack navigator with no visible header, so that all auth screens render without a navigation bar.

#### Acceptance Criteria

1. THE file `app/(auth)/_layout.tsx` SHALL export a default component that renders an Expo Router `Stack` navigator.
2. THE Stack navigator SHALL have `headerShown: false` applied to all screens via `screenOptions`.
