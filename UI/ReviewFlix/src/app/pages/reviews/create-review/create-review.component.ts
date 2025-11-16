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
import { ReviewService } from '../review.service';
import { catchError, of, take, tap } from 'rxjs';
import { CreateReview } from '../../../interfaces/createReview.interface';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  
  selector: 'app-create-review',
  standalone: true,
  imports: [
    ButtonModule, 
    StepperModule, 
    CardModule, 
    RatingModule, 
    DropdownModule, 
    MultiSelectModule, 
    InputTextModule, 
    TextareaModule, 
    ReactiveFormsModule, 
    AccordionModule, 
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './create-review.component.html',
  styleUrl: './create-review.component.scss'
})
export class CreateReviewComponent {
  private reviewService = inject(ReviewService);
  private messageService = inject(MessageService);

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
      pros: ['', Validators.required],
      cons: ['', Validators.required],
      
      // Шаг 3: Детальные критерии
      criteria: this.fb.array(
        this.criterionTemplates.map(template => 
          this.fb.group({
            templateId: [template.id],
            score: [0, [Validators.min(0), Validators.max(10)]]
          })
        )
      ),
      
      // Шаг 4: Теги
      tagIds: [[] as number[]] 
    });
  }

  
  // Методы для работы с criteria
  get criteriaArray(): FormArray {
    return this.reviewForm.get('criteria') as FormArray;
  }
  
  submitReview(): void {
    if (this.reviewForm.valid) {
      const formValue = this.reviewForm.value;
      const reviewData: CreateReview = {
        content: formValue.content,
        rating: formValue.rating,
        pros: formValue.pros,
        cons: formValue.cons,
        criteria: formValue.criteria.map((c: any) => ({
          templateId: c.templateId,
          score: c.score,
          comment: c.comment || undefined
        })),
        tagIds: formValue.tagIds || []
      };
      
      this.reviewService.sendReview(this.movieId, reviewData)
      .pipe(
        take(1),
        tap((response) => {
          if(response) {
            this.messageService.add(
              { severity: 'success', summary: 'Success', detail: 'Review created successfully' }
            );
            this.hideCreateReview();
          }
        }),
        catchError(() => {
          this.messageService.add(
            { severity: 'error', summary: 'Error', detail: 'Failed to create review' }
          );
          return of(null);
        }),
      )
      .subscribe();
    }
  }

  hideCreateReview(): void {
    this.createNewReviewVisible.emit(false);
  }

}
