import { TestBed } from '@angular/core/testing';

import { LoginService } from './login.service';
import { commonTestingProviders } from '../../../testing/common-testing-providers';

describe('LoginService', () => {
  let service: LoginService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: commonTestingProviders(),
    });
    service = TestBed.inject(LoginService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
