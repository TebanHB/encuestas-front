import { Component, Input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-cies-info-hint',
    standalone: true,
    imports: [TooltipModule],
    template: `
        <button
            type="button"
            class="cies-info-hint"
            [pTooltip]="text"
            tooltipPosition="top"
            [attr.aria-label]="ariaLabel"
        >
            <i class="pi pi-info-circle"></i>
        </button>
    `
})
export class CiesInfoHintComponent {
    @Input({ required: true }) text = '';
    @Input() ariaLabel = 'Información del apartado';
}
