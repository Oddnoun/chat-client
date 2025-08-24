import { Pipe, PipeTransform, NgZone, ChangeDetectorRef, OnDestroy, inject } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true,
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private timer: any;
  private ngZone = inject(NgZone);
  private changeDetectorRef = inject(ChangeDetectorRef);

  transform(value: Date): string {
    this.removeTimer();
    const now = new Date();
    const seconds = Math.floor((now.getTime() - value.getTime()) / 1000);

    let result: string;
    if (seconds < 60) {
      result = 'Now';
      this.scheduleUpdate(value, 1);
    } else {
      const minutes = Math.floor(seconds / 60);
      if (minutes < 15) {
        result = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        this.scheduleUpdate(value, 60);
      } else {
        result = new Intl.DateTimeFormat('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(value);
      }
    }
    return result;
  }

  private scheduleUpdate(value: Date, seconds: number) {
    this.ngZone.runOutsideAngular(() => {
      this.timer = setTimeout(() => {
        this.ngZone.run(() => this.changeDetectorRef.markForCheck());
      }, seconds * 1000);
    });
  }

  private removeTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.removeTimer();
  }
}