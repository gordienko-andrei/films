import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectableChipComponent } from './selectable-chip.component';

describe('SelectableChipComponent', () => {
  let component: SelectableChipComponent;
  let fixture: ComponentFixture<SelectableChipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectableChipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectableChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
