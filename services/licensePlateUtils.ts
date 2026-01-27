// Utility functions for handling Indonesian license plate format
export const licensePlateUtils = {
  /**
   * Validates Indonesian license plate format: XX-XXXX-XX (e.g., AB-1234-CD)
   */
  isValidIndonesianPlate(plate: string): boolean {
    const pattern = /^[A-Z]{1,2}-\d{1,4}-[A-Z]{1,3}$/;
    return pattern.test(plate.toUpperCase());
  },

  /**
   * Formats license plate to Indonesian standard
   */
  formatPlate(plate: string): string {
    // Remove all spaces and convert to uppercase
    const cleaned = plate.replace(/\s+/g, '').toUpperCase();
    
    // If already in correct format, return as is
    if (this.isValidIndonesianPlate(cleaned)) {
      return cleaned;
    }

    // Try to auto-format common inputs
    // Handle cases like "AB1234CD" -> "AB-1234-CD"
    const match = cleaned.match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{1,3})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }

    return cleaned;
  },

  /**
   * Generates a normalized ID from license plate for use as master data key
   */
  generateCustomerId(plate: string): string {
    return this.formatPlate(plate).replace(/-/g, '');
  },

  /**
   * Gets display format for license plate
   */
  getDisplayFormat(plate: string): string {
    return this.formatPlate(plate);
  },

  /**
   * Groups service records by customer (license plate)
   */
  groupByCustomer<T extends { licensePlate: string }>(records: T[]): Record<string, T[]> {
    const grouped: Record<string, T[]> = {};
    
    records.forEach(record => {
      const customerId = this.generateCustomerId(record.licensePlate);
      if (!grouped[customerId]) {
        grouped[customerId] = [];
      }
      grouped[customerId].push(record);
    });

    return grouped;
  },

  /**
   * Gets customer master data from service records
   */
  getCustomerMasterData<T extends { licensePlate: string; customerName: string; phone: string; vehicleModel: string }>(records: T[]): Array<{
    customerId: string;
    licensePlate: string;
    customerName: string;
    phone: string;
    vehicleModel: string;
    totalServices: number;
    lastService?: string;
    firstService?: string;
  }> {
    const grouped = this.groupByCustomer(records);
    
    return Object.entries(grouped).map(([customerId, customerRecords]) => {
      const latest = customerRecords[0];
      const sortedByDate = [...customerRecords].sort((a, b) => {
        const aTime = 'entryTime' in a ? (a as any).entryTime : 'bookingDate' in a ? (a as any).bookingDate : new Date().toISOString();
        const bTime = 'entryTime' in b ? (b as any).entryTime : 'bookingDate' in b ? (b as any).bookingDate : new Date().toISOString();
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      
      return {
        customerId,
        licensePlate: this.getDisplayFormat(latest.licensePlate),
        customerName: latest.customerName,
        phone: latest.phone,
        vehicleModel: latest.vehicleModel,
        totalServices: customerRecords.length,
        lastService: sortedByDate[0] ? ('entryTime' in sortedByDate[0] ? (sortedByDate[0] as any).entryTime : ('bookingDate' in sortedByDate[0] ? (sortedByDate[0] as any).bookingDate : undefined)) : undefined,
        firstService: sortedByDate[sortedByDate.length - 1] ? ('entryTime' in sortedByDate[sortedByDate.length - 1] ? (sortedByDate[sortedByDate.length - 1] as any).entryTime : ('bookingDate' in sortedByDate[sortedByDate.length - 1] ? (sortedByDate[sortedByDate.length - 1] as any).bookingDate : undefined)) : undefined,
      };
    });
  }
};