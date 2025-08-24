import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { ChatService } from './chat.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TimeAgoPipe } from './time-ago.pipe';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  chatService = inject(ChatService);
  sanitizer = inject(DomSanitizer);

  message = '';
  loading = signal(false);
  infoMessage = signal('Welcome to the chat!');

  showJumpToBottomButton = signal(false);

  // Access streaming signals from ChatService
  streamingInProgress = this.chatService.streamingInProgress;
  currentStreamMessage = this.chatService.currentStreamMessage;

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      if (this.chatService.messages() && this.messagesContainer?.nativeElement) {
        const element = this.messagesContainer.nativeElement;
        // Check if the user is at the very bottom or very close to it
        const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50; // Increased buffer
        if (atBottom) {
          // Use setTimeout to ensure DOM is updated before scrolling
          setTimeout(() => {
            this.scrollToBottom();
            this.showJumpToBottomButton.set(false); // Hide button if scrolled to bottom
          }, 0);
        }
      }
    });

    effect(() => {
      if (this.chatService.responseReceived()) {
        this.loading.set(false);
        this.chatService.responseReceived.set(false);
      }
    });

    this.chatService.connectionStatus.subscribe((status) => {
      this.infoMessage.set(`Connection Status: ${status}`);
    });
  }

  sendMessage() {
    this.chatService.sendMessage(this.message);
    this.message = '';
    this.loading.set(true);
  }

  clearChat() {
    this.chatService.messages.set([]);
    this.showJumpToBottomButton.set(false);
  }

  onScroll() {
    const element = this.messagesContainer.nativeElement;
    const atBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    this.showJumpToBottomButton.set(!atBottom);
  }

  scrollToBottom() {
    this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
  }

  parseMarkdown(text: string): SafeHtml {
    // This method is no longer needed as parsing is done in ChatService
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }
}

