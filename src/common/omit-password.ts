export const omitPassword = <T extends { password?: string }>(user: T) => {
  const safe = { ...user };
  delete safe.password;
  return safe as Omit<T, 'password'>;
};
