import { dataSource } from '../config/database.config';
import { TenantEntity } from '../entity/tenant.entity';

export class TenantRepository {
  private readonly tenantRepository = dataSource.getRepository(TenantEntity)

  public async createTenant(tenant: TenantEntity){
    return await this.tenantRepository.save(tenant)
  }

  public async updateTenant(tenant: TenantEntity){
    return await this.tenantRepository.save(tenant)
  }

  public async getTenantById(id: number){
    return await this.tenantRepository.findOne({
      where: { id: id }
    })
  }

  public async deleteTenant(id: number){
    return await this.tenantRepository.delete({ id: id })
  }

  public async getAllTenants(){
    return await this.tenantRepository.find()
  }
}