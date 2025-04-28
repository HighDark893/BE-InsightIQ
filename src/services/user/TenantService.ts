import axios from 'axios';
import { Logger } from '../../utils/Logger';
import { TenantRepository } from '../../repository/user/tenant.repository';
import { TenantDto } from '../../dto/user/tenant.dto';
import { TenantEntity } from '../../entity/tenant.entity';


export class TenantService {
    private readonly tenantRepository = new TenantRepository();

    private readonly logger = Logger.getInstance();

    constructor() {

    }

    async createTenantRequest(tenantDto: TenantDto){

        const tenantEntity = new TenantEntity();
        tenantEntity.companyName = tenantDto.companyName;
        tenantEntity.fullName = tenantDto.fullName;
        tenantEntity.taxId = tenantDto.taxId;
        await this.tenantRepository.createTenant(tenantEntity);
    }
}
