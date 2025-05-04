import { Logger } from '../utils/Logger';
import { SuperAdminEntity } from '../entity/superadmin.entity';
import { SuperAdminDto } from '../dto/superadmin.dto';
import { SuperAdminRepository } from '../repository/superadmin.repository';
import { UserRepository } from '../repository/user.repository';

export class SuperAdminService {
  private readonly superAdminRepository = new SuperAdminRepository();
  private readonly userRepository = new UserRepository();

  private readonly logger = Logger.getInstance();

  constructor() {}

  async createSuperAdminRequest(superAdminDto: SuperAdminDto) {
    const superAdminEntity = new SuperAdminEntity();
    superAdminEntity.username = superAdminDto.username;

    const userEntity = await this.userRepository.getUserById(
      superAdminDto.userId,
    );

    if (!userEntity) {
      return null;
    }

    superAdminEntity.user = userEntity;

    await this.superAdminRepository.createSuperAdmin(superAdminEntity);

    superAdminDto.userId = userEntity.id;

    return superAdminDto;
  }

  async updateSuperAdmin(superAdminDto: SuperAdminDto) {
    const superAdminEntity = await this.superAdminRepository.getSuperAdminById(
      superAdminDto.id,
    );
    if (!superAdminEntity) {
      return {
        success: false,
        message: 'Super admin not found. Update failed.',
      };
    }

    superAdminEntity.username = superAdminDto.username;

    await this.superAdminRepository.updateSuperAdmin(superAdminEntity);
    return {
      success: true,
      message: 'Super admin updated successfully.',
    };
  }

  async getSuperAdminById(id: number) {
    return await this.superAdminRepository.getSuperAdminById(id);
  }
}
