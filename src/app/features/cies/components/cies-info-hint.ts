import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, ViewChild, inject } from '@angular/core';

@Component({
    selector: 'app-cies-info-hint',
    standalone: true,
    imports: [CommonModule],
    template: `
        <span class="cies-info-hint-wrapper">
            <button
                #trigger
                type="button"
                class="cies-info-hint"
                [class.cies-info-hint--open]="open"
                [attr.aria-label]="ariaLabel"
                [attr.aria-expanded]="open"
                (click)="toggle($event)"
            >
                <i class="pi pi-info-circle"></i>
            </button>
            <span
                #popover
                *ngIf="open"
                class="cies-info-hint-popover"
                [class.cies-info-hint-popover--below]="placement === 'below'"
                [style.top.px]="position.top"
                [style.left.px]="position.left"
                role="status"
            >
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
            position: fixed;
            z-index: 10000;
            width: min(18rem, calc(100vw - 1.5rem));
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

        .cies-info-hint-popover--below::after {
            top: auto;
            bottom: 100%;
            border-width: 0 0.45rem 0.45rem;
            border-color: transparent transparent var(--surface-card);
        }
    `]
})
export class CiesInfoHintComponent {
    private elementRef = inject(ElementRef<HTMLElement>);

    @ViewChild('trigger') triggerRef?: ElementRef<HTMLElement>;
    @ViewChild('popover') popoverRef?: ElementRef<HTMLElement>;

    @Input({ required: true }) text = '';
    @Input() ariaLabel = 'Informacion del apartado';

    open = false;
    placement: 'above' | 'below' = 'above';
    position = { top: 0, left: 0 };

    toggle(event: MouseEvent): void {
        event.stopPropagation();
        this.open = !this.open;
        if (this.open) {
            setTimeout(() => this.updatePosition());
        }
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

    @HostListener('window:resize')
    @HostListener('window:scroll')
    updatePosition(): void {
        if (!this.open || !this.triggerRef?.nativeElement || !this.popoverRef?.nativeElement) {
            return;
        }

        const margin = 12;
        const gap = 10;
        const trigger = this.triggerRef.nativeElement.getBoundingClientRect();
        const popover = this.popoverRef.nativeElement.getBoundingClientRect();
        const width = Math.min(popover.width || 288, window.innerWidth - margin * 2);
        const height = popover.height || 48;

        const preferredLeft = trigger.right - width;
        const left = Math.min(Math.max(margin, preferredLeft), window.innerWidth - width - margin);
        const hasSpaceAbove = trigger.top >= height + gap + margin;
        const top = hasSpaceAbove
            ? trigger.top - height - gap
            : Math.min(trigger.bottom + gap, window.innerHeight - height - margin);

        this.placement = hasSpaceAbove ? 'above' : 'below';
        this.position = { top: Math.max(margin, top), left };
    }
}
