import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { LifeMonitorApiService } from 'src/app/core/services/lifemonitor/lifemonitor-api.service';

import { PublicWorkflowsComponent } from './public-workflows.component';

describe('PublicWorkflowsComponent', () => {
  let component: PublicWorkflowsComponent;
  let fixture: ComponentFixture<PublicWorkflowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PublicWorkflowsComponent],
      providers: [provideMockStore({})],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicWorkflowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
