import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shortNumber',
  standalone: true,
  pure: true,
})
export class ShortNumberPipe implements PipeTransform {

  transform(value: number | string): string {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0';
    if (n === 0) return '0';
  
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    let exp = Math.min(Math.floor(Math.log10(Math.abs(n)) / 3), suffixes.length - 1);
    let scaled = n / 10 ** (exp * 3);
  
    if (Math.abs(scaled) >= 999.5 && exp < suffixes.length - 1) {
      exp += 1;
      scaled = n / 10 ** (exp * 3);
    }
  
    const rounded = Math.round(scaled * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `${text}${suffixes[exp]}`;
  }

}
