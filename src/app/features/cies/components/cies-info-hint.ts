import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, inject } from '@angular/core';

@Component({
    selector: 'app-cies-info-hint',
    standalone: true,
    imports: [CommonModule],
    template: `
        <span class="cies-info-hint-wrapper">
            <button
                type="button"
                class="cies-info-hint"
                [class.cies-info-hint--open]="open"
                [attr.aria-label]="ariaLabel"
                [attr.aria-expanded]="open"
                (click)="toggle($event)"
            >
                <i class="pi pi-info-circle"></i>
            </button>
            <span *ngIf="open" class="cies-info-hint-popover" role="status">
                {{ text }}
            </span>
        </span>
    `,
    styles: [`
        .cies-info-hint-wrapper {
            position: relative;
            display: inline-flex;
            align-items: center;
        }

        .cies-info-hint {
            touch-action: manipulation;
        }

        .cies-info-hint--open {
            border-color: var(--layout-accent-soft-strong);
            box-shadow: var(--layout-shadow-soft);
        }

        .cies-info-hint-popover {
            position: absolute;
            right: 0;
            bottom: calc(100% + 0.5rem);
            z-index: 1200;
            width: max-content;
            max-width: min(18rem, calc(100vw - 2rem));
            padding: 0.65rem 0.75rem;
            border: 1px solid var(--layout-border-soft);
            border-radius: 0.65rem;
            background: var(--surface-card);
            color: var(--text-color);
            box-shadow: var(--layout-shadow-soft);
            font-size: 0.82rem;
            line-height: 1.35;
            text-align: left;
            white-space: normal;
        }

        .cies-info-hint-popover::after {
            content: '';
            position: absolute;
            right: 0.65rem;
            top: 100%;
            border-width: 0.45rem 0.45rem 0;
            border-style: solid;
            border-color: var(--surface-card) transparent transparent;
        }
    `]
})
export class CiesInfoHintComponent {
    private elementRef = inject(ElementRef<HTMLElement>);

    @Input({ required: true }) text = '';
    @Input() ariaLabel = 'Informacion del apartado';

    open = false;

    toggle(event: MouseEvent): void {
        event.stopPropagation();
        this.open = !this.open;
    }

    @HostListener('document:click', ['$event'])
    closeOnOutsideClick(event: MouseEvent): void {
        if (!this.open) return;
        const target = event.target as Node | null;
        if (target && this.elementRef.nativeElement.contains(target)) return;
        this.open = false;
    }

    @HostListener('document:keydown.escape')
    closeOnEscape(): void {
        this.open = false;
    }
}
