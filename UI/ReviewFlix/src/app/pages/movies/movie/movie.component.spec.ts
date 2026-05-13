import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { MovieComponent } from './movie.component';
import { commonTestingProviders } from '../../../../testing/common-testing-providers';

describe('MovieComponent', () => {
  let component: MovieComponent;
  let fixture: ComponentFixture<MovieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieComponent],
      providers: commonTestingProviders([
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { id: 'movie-id' } },
            params: of({ id: 'movie-id' }),
          },
        },
      ]),
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
