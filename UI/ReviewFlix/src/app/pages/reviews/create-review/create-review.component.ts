import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { NonNullableFormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { CardModule } from 'primeng/card';
import { RatingModule } from 'primeng/rating';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ReactiveFormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-create-review',
  standalone: true,
  imports: [ButtonModule, StepperModule, CardModule, RatingModule, DropdownModule, MultiSelectModule, InputTextModule, TextareaModule, ReactiveFormsModule, AccordionModule],
  templateUrl: './create-review.component.html',
  styleUrl: './create-review.component.scss'
})
export class CreateReviewComponent {
  @Input() movieId!: string;
  @Output() createNewReviewVisible: EventEmitter<boolean> = new EventEmitter<boolean>();

  private fb = inject(NonNullableFormBuilder);
  activeIndex = 0;

  reviewForm: FormGroup;
  
  // Предопределенные критерии (загружаются с бэкенда)
  criterionTemplates = [
    { id: 1, name: 'Сюжет', category: 'story' },
    { id: 2, name: 'Актерская игра', category: 'acting' },
    { id: 3, name: 'Визуальные эффекты', category: 'technical' },
    { id: 4, name: 'Звук и музыка', category: 'technical' },
    { id: 5, name: 'Режиссура', category: 'direction' }
  ];
  
  // Теги для отзывов (загружаются с бэкенда)
  reviewTags = [
    { id: 1, name: 'Атмосферный', category: 'mood' },
    { id: 2, name: 'Эмоциональный', category: 'mood' },
    { id: 3, name: 'Экшн', category: 'genre-feel' },
    { id: 4, name: 'Комедия', category: 'genre-feel' }
  ];

  get tagIdsControl() {
    return this.reviewForm.get('tagIds');
  }
  
  constructor() {
    this.reviewForm = this.fb.group({
      // Шаг 1: Основная информация
      content: ['', [Validators.required, Validators.minLength(10)]],
      rating: [0, [Validators.required, Validators.min(1), Validators.max(10)]],
      
      // Шаг 2: Плюсы и минусы
      pros: this.fb.array([]),
      cons: this.fb.array([]),
      
      // Шаг 3: Детальные критерии
      criteria: this.fb.array([]),
      
      // Шаг 4: Теги
      tagIds: [[] as number[]] 
    });
  }
  
  // Методы для работы с pros
  get prosArray(): FormArray {
    return this.reviewForm.get('pros') as FormArray;
  }
  
  addPro(): void {
    this.prosArray.push(this.fb.control('', Validators.required));
  }
  
  removePro(index: number): void {
    this.prosArray.removeAt(index);
  }
  
  // Методы для работы с cons
  get consArray(): FormArray {
    return this.reviewForm.get('cons') as FormArray;
  }
  
  addCon(): void {
    this.consArray.push(this.fb.control('', Validators.required));
  }
  
  removeCon(index: number): void {
    this.consArray.removeAt(index);
  }
  
  // Методы для работы с criteria
  get criteriaArray(): FormArray {
    return this.reviewForm.get('criteria') as FormArray;
  }
  
  addCriterion(): void {
    this.criteriaArray.push(this.fb.group({
      templateId: [null, Validators.required],
      score: [0, [Validators.required, Validators.min(1), Validators.max(10)]],
      comment: ['']
    }));
  }
  
  removeCriterion(index: number): void {
    this.criteriaArray.removeAt(index);
  }
  
  submitReview(): void {
    if (this.reviewForm.valid) {
      const formValue = this.reviewForm.value;
      const reviewData = {
        content: formValue.content,
        rating: formValue.rating,
        pros: formValue.pros.filter((p: string) => p.trim().length > 0),
        cons: formValue.cons.filter((c: string) => c.trim().length > 0),
        criteria: formValue.criteria.map((c: any) => ({
          templateId: c.templateId,
          score: c.score,
          comment: c.comment || undefined
        })),
        tagIds: formValue.tagIds || []
      };
      
      // Отправка на бэкенд
      console.log(reviewData);
    }
  }

  hideCreateReview(): void {
    this.createNewReviewVisible.emit(false);
  }

}
