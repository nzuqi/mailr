import crypto from 'crypto';

export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const generateRandomString = (length: number, hasSpecialChars: boolean = false) => {
  let result: string = '';
  let characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  if (hasSpecialChars) {
    characters += '~!@#$%^&*-_=+<>?;:{}[].,';
  }
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');

  // Hashing salt and password with 100 iterations, 64 length and sha512 digest
  return crypto.pbkdf2Sync(password, salt, 100, 64, `sha512`).toString(`hex`);
};

export const capitalizeFirstLetter = (str: string) => (str.charAt(0).toUpperCase() + str.slice(1));