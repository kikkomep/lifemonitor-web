import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseDataViewComponent } from './base-data-view.component';

describe('BaseDataViewComponent', () => {
  let component: BaseDataViewComponent;
  let fixture: ComponentFixture<BaseDataViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BaseDataViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseDataViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
