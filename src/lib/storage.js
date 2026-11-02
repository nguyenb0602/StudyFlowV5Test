// Browser-only storage for classroom demonstrations.
// No passwords are stored, and this is NOT an authentication system.
const ACCOUNT_KEY = 'studyplanner_demo_accounts_v1';
const SESSION_KEY = 'studyplanner_demo_active_user_v1';

function readJSON(key, fallback) {
  try {
    const text = localStorage.getItem(key);
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Could not save demo data in browser storage:', error);
  }
}

export function getAccounts() {
  const accounts = readJSON(ACCOUNT_KEY, []);
  return Array.isArray(accounts) ? accounts : [];
}

export function addAccount(account) {
  saveJSON(ACCOUNT_KEY, [...getAccounts(), account]);
}

export function getActiveUser() {
  const user = readJSON(SESSION_KEY, null);
  return user && typeof user.email === 'string' ? user : null;
}

export function setActiveUser(user) {
  if (user) {
    saveJSON(SESSION_KEY, user);
  } else {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Browser storage may be disabled.
    }
  }
}

function dataKey(email) {
  return `studyplanner_demo_data_v1_${encodeURIComponent(email.trim().toLowerCase())}`;
}

export function loadPlannerData(email) {
  const data = readJSON(dataKey(email), { courses: [], events: [] });
  return {
    courses: Array.isArray(data?.courses) ? data.courses : [],
    events: Array.isArray(data?.events) ? data.events : [],
  };
}

export function savePlannerData(email, data) {
  saveJSON(dataKey(email), data);
}
