import jwt from 'jsonwebtoken';
import { UserEntity } from '../entity/user.entity';
import { SuperAdminEntity } from '../entity/superadmin.entity';
import { TenantEntity } from '../entity/tenant.entity';
import { UserChatbotEntity } from '../entity/userChatbot.entity';
import { dataSource } from '../config/database.config';

const superAdminRepo = dataSource.getRepository(SuperAdminEntity);
const tenantRepo = dataSource.getRepository(TenantEntity);
const userChatbotRepo = dataSource.getRepository(UserChatbotEntity);

export const generateJWT = async (user: UserEntity): Promise<string | null> => {
  let role = 'USER';

  let token = '';
  const superAdmin = await superAdminRepo.findOne({
    where: { user: { id: user.id } },
  });
  const tenant = await tenantRepo.findOne({ where: { user: { id: user.id } } });

  const userChatbot = await userChatbotRepo.findOne({
    where: { user: { id: user.id } },
  });

  if (superAdmin) {
    role = 'SUPERADMIN';
    token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role,
        superAdminId: superAdmin.id,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      } as jwt.SignOptions,
    );
  } else if (tenant) {
    if (tenant.status === 'DISABLED') {
      return null;
    }

    role = 'TENANT';
    token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role,
        tenantId: tenant.id,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      } as jwt.SignOptions,
    );
  } else if (userChatbot) {
    role = 'USERCHATBOT';
    token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role,
        userChatbotId: userChatbot.id,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      } as jwt.SignOptions,
    );
  }

  return token;
};

export class AuthService {
  public async login(email: string, password: string): Promise<string | null> {
    const user = await UserEntity.findOne({ where: { email: email } });

    if (!user || user.passwordHash !== password) {
      return null;
    }
    return generateJWT(user);
  }
}
