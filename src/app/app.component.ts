import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { PrimeNGConfig } from 'primeng/api';
import { loadConfiguration } from './core/actions/config.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'lifemonitor';

  constructor(private primengConfig: PrimeNGConfig, private store: Store) {
    this.store.dispatch(loadConfiguration());
  }

  ngOnInit() {
    this.primengConfig.ripple = true;
    this.primengConfig.overlayOptions = {
      mode: 'overlay',
    };
  }
}

if (typeof Worker !== 'undefined') {
  // Create a new
  const worker = new Worker(new URL('./workers/w1.worker', import.meta.url));
  worker.onmessage = ({ data }) => {
    console.log(`page got message: ${data}`);
  };
  worker.postMessage('hello');

  // const w2 = new Worker(new URL('./workers/w2.worker', import.meta.url));
  // w2.onmessage = ({ data }) => {
  //   console.log(`page got message: ${data}`);
  // };
  // w2.postMessage('hello');
} else {
  // Web workers are not supported in this environment.
  // You should add a fallback so that your program still executes correctly.
}
