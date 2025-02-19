class Storage {
    private prefix: string;
  
    constructor(prefix: string = 'app_') {
      this.prefix = prefix;
    }
  
    setItem(key: string, value: any): void {
      if (typeof window === 'undefined') return;
      
      try {
        const serializedValue = JSON.stringify(value);
        localStorage.setItem(this.prefix + key, serializedValue);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  
    getItem<T>(key: string): T | null {
      if (typeof window === 'undefined') return null;
      
      try {
        const item = localStorage.getItem(this.prefix + key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
      }
    }
  
    removeItem(key: string): void {
      if (typeof window === 'undefined') return;
      
      try {
        localStorage.removeItem(this.prefix + key);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    }
  
    clear(): void {
      if (typeof window === 'undefined') return;
      
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  
    // Kiểm tra xem localStorage có khả dụng không
    isAvailable(): boolean {
      if (typeof window === 'undefined') return false;
      
      try {
        const testKey = '__test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
  
  export const storage = new Storage();
  