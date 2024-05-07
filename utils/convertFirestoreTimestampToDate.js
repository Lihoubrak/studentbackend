export function convertFirestoreTimestampToDate(timestamp) {
  const milliseconds =
    timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000;
  return new Date(milliseconds);
}
