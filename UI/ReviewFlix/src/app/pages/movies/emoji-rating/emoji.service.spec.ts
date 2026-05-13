import { TestBed } from '@angular/core/testing';

import { EmojiService } from './emoji.service';
import { commonTestingProviders } from '../../../../testing/common-testing-providers';

describe('EmojiService', () => {
  let service: EmojiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: commonTestingProviders(),
    });
    service = TestBed.inject(EmojiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
