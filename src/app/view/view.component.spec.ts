import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageLayoutComponent } from './containers/page-layout/page-layout.component';

import { ViewComponent } from './view.component';
import { provideMockStore } from '@ngrx/store/testing';
import { PublicWorkflowsComponent } from './containers/public-workflows/public-workflows.component';

describe('ViewComponent', () => {
  let component: ViewComponent;
  let fixture: ComponentFixture<ViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      declarations: [
        ViewComponent,
        PageLayoutComponent,
        PublicWorkflowsComponent,
      ],
      providers: [provideMockStore({})],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
