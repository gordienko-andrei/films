import { TestBed } from '@angular/core/testing';

import { MoviesService } from './movies.service';
import { commonTestingProviders } from '../../testing/common-testing-providers';

describe('MoviesService', () => {
  let service: MoviesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: commonTestingProviders(),
    });
    service = TestBed.inject(MoviesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
