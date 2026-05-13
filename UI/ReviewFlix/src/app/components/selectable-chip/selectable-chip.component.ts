import { Component, computed, forwardRef, input } from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';
import { ReviewTag } from '../../interfaces/review.interface';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FormsModule } from '@angular/forms';

export const SELECTABLE_CHIP_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectableChipComponent),
  multi: true,
};

@Component({
  selector: 'app-selectable-chip',
  standalone: true,
  imports: [CheckboxModule, FormsModule],
  providers: [SELECTABLE_CHIP_VALUE_ACCESSOR],
  templateUrl: './selectable-chip.component.html',
  styleUrl: './selectable-chip.component.scss',
})
export class SelectableChipComponent implements ControlValueAccessor {
  readonly tag = input<ReviewTag>();
  readonly disabled = input<boolean>(false);
  readonly selectedTagIds = input<number[]>([]);
  readonly tagId = computed(() => this.tag()?.id ?? 0);
  readonly tagName = computed(() => this.tag()?.name ?? '');

  private modelTagIds: number[] = [];
  private disabledFromForm = false;
  private onTouchedCallback: () => void = () => {};
  private onChangeCallback: (value: number[]) => void = () => {};

  get checked(): boolean {
    const id = this.tagId();
    return id > 0 && this.getCurrentTagIds().includes(id);
  }

  get isDisabled(): boolean {
    return this.disabled() || this.disabledFromForm;
  }

  writeValue(value: number[] | null): void {
    if (!Array.isArray(value)) {
      this.modelTagIds = [];
      return;
    }
    this.modelTagIds = [...value];
  }

  registerOnChange(fn: (value: number[]) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledFromForm = isDisabled;
  }

  onCheckboxChange(checked: boolean): void {
    const id = this.tagId();
    if (id <= 0) {
      return;
    }
    const nextTagIds = [...this.getCurrentTagIds()];
    const hasId = nextTagIds.includes(id);
    if (checked && !hasId) {
      nextTagIds.push(id);
    } else if (!checked && hasId) {
      const index = nextTagIds.indexOf(id);
      if (index >= 0) {
        nextTagIds.splice(index, 1);
      }
    }

    this.modelTagIds = nextTagIds;
    this.onChangeCallback(nextTagIds);
    this.onTouchedCallback();
  }

  markTouched(): void {
    this.onTouchedCallback();
  }

  private getCurrentTagIds(): number[] {
    const external = this.selectedTagIds();
    if (Array.isArray(external)) {
      return external;
    }
    return this.modelTagIds;
  }
}
