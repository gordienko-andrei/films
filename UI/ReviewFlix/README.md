# ReviewFlix

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.0.4.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Production API URL strategy

`src/environments/environment.prod.ts` uses `apiUrl: '__API_URL__'`.

For release builds, replace this placeholder in CI/CD from a secret/variable (for example `UI_API_URL`), then run:

```bash
npm run build:ci
```

In GitHub Actions, this is already wired in `.github/workflows/ci.yml` via:
- `UI_API_URL` secret for API origin
- `sed` replacement before frontend production build

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
