import { TestBed } from '@angular/core/testing';

import { ReviewService } from './review.service';
import { commonTestingProviders } from '../../../testing/common-testing-providers';

describe('ReviewService', () => {
  let service: ReviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: commonTestingProviders(),
    });
    service = TestBed.inject(ReviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
