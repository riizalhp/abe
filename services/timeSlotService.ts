import { SecurityUtils } from '../lib/security';
import { getStoredBranchId } from '../lib/BranchContext';

// Time Slots Management Service
export interface TimeSlot {
  id: string;
  time: string; // Format: "HH:mm"
  label: string; // e.g., "09:00 AM"
  isActive: boolean;
  maxBookings?: number;
  dayOfWeek?: string[]; // ['monday', 'tuesday', etc] - empty means all days
}

class TimeSlotService {
  private static instance: TimeSlotService;
  private readonly STORAGE_KEY_PREFIX = 'time_slots_settings';

  static getInstance(): TimeSlotService {
    if (!TimeSlotService.instance) {
      TimeSlotService.instance = new TimeSlotService();
    }
    return TimeSlotService.instance;
  }

  // Get storage key based on current branch
  private getStorageKey(): string {
    const branchId = getStoredBranchId();
    return branchId ? `${this.STORAGE_KEY_PREFIX}_${branchId}` : this.STORAGE_KEY_PREFIX;
  }

  // Get all time slots
  getAllTimeSlots(): TimeSlot[] {
    try {
      const storageKey = this.getStorageKey();
      // Use SecurityUtils.getSecureItem to match saveToStorage
      const data = SecurityUtils.getSecureItem(storageKey) as TimeSlot[] | null;
      if (!data || data.length === 0) {
        // Return default slots if none saved
        return this.getDefaultTimeSlots();
      }
      
      return data.map((item: any) => ({
        ...item,
      }));
    } catch (error) {
      console.error('Failed to load time slots:', error);
      return this.getDefaultTimeSlots();
    }
  }

  // Get active time slots only
  getActiveTimeSlots(): TimeSlot[] {
    return this.getAllTimeSlots().filter(slot => slot.isActive);
  }

  // Get default time slots
  private getDefaultTimeSlots(): TimeSlot[] {
    return [
      {
        id: '1',
        time: '09:00',
        label: '09:00 AM',
        isActive: true,
        maxBookings: 5,
        dayOfWeek: []
      },
      {
        id: '2',
        time: '10:30',
        label: '10:30 AM',
        isActive: true,
        maxBookings: 5,
        dayOfWeek: []
      },
      {
        id: '3',
        time: '13:00',
        label: '01:00 PM',
        isActive: true,
        maxBookings: 5,
        dayOfWeek: []
      },
      {
        id: '4',
        time: '15:30',
        label: '03:30 PM',
        isActive: true,
        maxBookings: 5,
        dayOfWeek: []
      }
    ];
  }

  // Save time slot
  saveTimeSlot(slot: Omit<TimeSlot, 'id'>): TimeSlot {
    const existingSlots = this.getAllTimeSlots();
    
    const newSlot: TimeSlot = {
      ...slot,
      id: Date.now().toString(),
    };
    
    const updatedSlots = [...existingSlots, newSlot];
    this.saveToStorage(updatedSlots);
    
    return newSlot;
  }

  // Update time slot
  updateTimeSlot(id: string, updates: Partial<TimeSlot>): void {
    const slots = this.getAllTimeSlots();
    const index = slots.findIndex(slot => slot.id === id);
    
    if (index === -1) return;
    
    slots[index] = { ...slots[index], ...updates };
    this.saveToStorage(slots);
  }

  // Delete time slot
  deleteTimeSlot(id: string): void {
    const slots = this.getAllTimeSlots();
    const filteredSlots = slots.filter(slot => slot.id !== id);
    this.saveToStorage(filteredSlots);
  }

  // Save all time slots to localStorage with encryption
  private saveToStorage(slots: TimeSlot[]): void {
    try {
      const storageKey = this.getStorageKey();
      const validatedSlots = slots.map(slot => ({
        ...slot,
        label: SecurityUtils.sanitizeInput(slot.label),
        time: SecurityUtils.sanitizeInput(slot.time)
      }));
      SecurityUtils.setSecureItem(storageKey, validatedSlots);
    } catch (error) {
      console.error('Failed to save time slots:', error);
    }
  }

  // Format time for display
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 >= 12 ? 'PM' : 'AM';
    
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
  }

  // Reset to default slots
  resetToDefaults(): void {
    const defaultSlots = this.getDefaultTimeSlots();
    this.saveToStorage(defaultSlots);
  }
}

export default TimeSlotService.getInstance();