import { Role } from '../enums/Role.enum';

export type CurrentUser = {
  id: number;
  role: Role;
};
