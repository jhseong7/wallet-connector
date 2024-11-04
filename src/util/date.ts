const addSeconds = (date: Date, seconds: number): Date => {
  return new Date(date.getTime() + seconds * 1000);
};

const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

const addHours = (date: Date, hours: number): Date => {
  return new Date(date.getTime() + hours * 3600000);
};

const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * 86400000);
};

// Help class to make the date manupulation easier using the builder pattern
class DateManupulateBuilder {
  private date: Date;

  constructor(date: Date) {
    this.date = date;
  }

  static fromDate(date: Date): DateManupulateBuilder {
    return new DateManupulateBuilder(date);
  }

  build = () => this.date;

  addSeconds = (seconds: number) => {
    this.date = addSeconds(this.date, seconds);
    return this;
  };

  addMinutes = (minutes: number) => {
    this.date = addMinutes(this.date, minutes);
    return this;
  };

  addHours = (hours: number) => {
    this.date = addHours(this.date, hours);
    return this;
  };

  addDays = (days: number) => {
    this.date = addDays(this.date, days);
    return this;
  };
}

export { DateManupulateBuilder, addDays, addHours, addMinutes, addSeconds };
