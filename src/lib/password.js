// Classroom demo validation only. Real authentication needs server-side
// password policy enforcement (for example, through Cognito).
export function passwordChecks(password) {
  return [
    { label: 'At least 10 characters', passed: [...password].length >= 10 },
  ];
}

export function validatePassword(password) {
  return passwordChecks(password).every((check) => check.passed)
    ? ''
    : 'Password must be at least 10 characters.';
}
