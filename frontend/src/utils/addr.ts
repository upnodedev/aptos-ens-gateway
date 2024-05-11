export function formatAddress(address: string): string {
  // Check if the address length is at least 15 characters
  if (address.length < 15) {
      return address; // Return the original address if it's too short to format
  }
  
  // Extract the first 7 characters and the last 6 characters
  const start = address.slice(0, 8);
  const end = address.slice(-6);
  
  // Combine them with an ellipsis in the middle
  return `${start}...${end}`;
}