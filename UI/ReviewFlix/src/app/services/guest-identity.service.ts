import { Injectable } from '@angular/core';

const STORAGE_KEY = 'reviewflix_guest_id';

@Injectable({ providedIn: 'root' })
export class GuestIdentityService {
  private memoryId: string | null = null;

  /** Стабильный UUID гостя в localStorage (для реакций и отзывов без входа). */
  getOrCreate(): string {
    // Mobile/private browsers can block localStorage access.
    if (typeof localStorage === 'undefined') {
      return this.getMemoryId();
    }

    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = this.generateId();
        localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    } catch {
      return this.getMemoryId();
    }
  }

  private getMemoryId(): string {
    if (!this.memoryId) {
      this.memoryId = this.generateId();
    }
    return this.memoryId;
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
