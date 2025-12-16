// Sample TypeScript file for parser testing

interface User {
  id: number;
  name: string;
  email?: string;
}

type Status = "active" | "inactive";

let users: Array<User>;

function createUser(name: string, id: number): User {
  return name;
}
