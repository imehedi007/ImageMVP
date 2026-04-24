export function calculateAgeFromDateOfBirth(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);

  if (Number.isNaN(dob.getTime())) {
    throw new Error("Enter a valid date of birth.");
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  if (age < 8 || age > 100) {
    throw new Error("Age must be between 8 and 100.");
  }

  return age;
}
