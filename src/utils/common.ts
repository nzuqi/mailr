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
  const hash = crypto.pbkdf2Sync(password, salt, 100, 64, 'sha512').toString('hex');
  // store "salt:hash" together

  return `${salt}:${hash}`;
};

export const comparePassword = (password: string, hashPassword: string) => {
  const [salt, storedHash] = hashPassword.split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const hash = crypto.pbkdf2Sync(password, salt, 100, 64, 'sha512').toString('hex');

  return hash === storedHash;
};

export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const obscureEmail = (email: string) => {
  const [localPart, domain] = email.split('@');

  if (!localPart || !domain) {
    return email;
  } // invalid email, return as-is

  // Show only first and last character of local part
  const maskedLocal =
    localPart.length <= 2 ? localPart[0] + '*'.repeat(localPart.length - 1) : localPart[0] + '*'.repeat(localPart.length - 2) + localPart.slice(-1);

  // Mask the domain's first part, keep the TLD visible
  const [domainName, ...tldParts] = domain.split('.');
  const maskedDomain = domainName[0] + '*'.repeat(Math.max(domainName.length - 2, 1)) + domainName.slice(-1);

  return `${maskedLocal}@${maskedDomain}.${tldParts.join('.')}`;
};
