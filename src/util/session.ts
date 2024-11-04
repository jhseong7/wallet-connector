import { DateManupulateBuilder } from './date';

// Set data to session storage with expire time (in seconds)
const setWithExpire = (
  key: string,
  value: string,
  expire: { day?: number; hour?: number; minute?: number; second?: number }
) => {
  // the expire date
  const expireDate = DateManupulateBuilder.fromDate(new Date())
    .addDays(expire.day ?? 0)
    .addHours(expire.hour ?? 0)
    .addMinutes(expire.minute ?? 0)
    .addSeconds(expire.second ?? 0)
    .build()
    .toISOString();

  window.sessionStorage.setItem(key, JSON.stringify({ value, expireDate }));
};

const getWithExpire = (key: string): { value: string; hasExpired: boolean } => {
  const data = window.sessionStorage.getItem(key);
  if (!data) return { value: '', hasExpired: false };

  try {
    const { value, expireDate } = JSON.parse(data);
    if (expireDate < new Date().toISOString()) {
      window.sessionStorage.removeItem(key);
      return { value: '', hasExpired: true };
    }

    return { value, hasExpired: false };
  } catch (e) {
    return { value: '', hasExpired: false };
  }
};

const removeItem = (key: string) => {
  window.sessionStorage.removeItem(key);
};

const sessionStorageHelper = {
  setWithExpire,
  getWithExpire,
  removeItem,
};

export { sessionStorageHelper };
