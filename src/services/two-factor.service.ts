import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import { User } from '../models';

export class TwoFactorService {
  async generateSecret(userId: string, email: string) {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `Mailr (${email})`,
      issuer: 'Mailr',
    });

    await User.findByIdAndUpdate(userId, { twoFactorSecret: secret.base32 }).exec();

    return {
      secret: secret.base32,
      qr: await QRCode.toDataURL(secret.otpauth_url || ''),
    };
  }

  async verifyCode(userId: string, token: string): Promise<boolean> {
    const user = await User.findById(userId).select('+twoFactorSecret').exec();

    if (!user?.twoFactorSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  async enable(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { twoFactorEnabled: true }).exec();
  }

  async disable(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    }).exec();
  }
}
