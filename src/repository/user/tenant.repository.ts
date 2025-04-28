import { UserEntity } from '../../entity/user.entity';
import { dataSource } from '../../config/database.config';
import { TenantEntity } from '../../entity/tenant.entity';

export class TenantRepository {
  private readonly tenantRepository = dataSource.getRepository(TenantEntity)

  public async createTenant(tenant: TenantEntity){
    return await this.tenantRepository.save(tenant)
  }
}