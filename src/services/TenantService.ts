import { Logger } from '../utils/Logger';
import { TenantRepository } from '../repository/tenant.repository';
import { TenantDto } from '../dto/tenant.dto';
import { TenantEntity } from '../entity/tenant.entity';


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
        tenantEntity.user.id = tenantDto.userId;
        await this.tenantRepository.createTenant(tenantEntity);
    }

    async updateTenant(tenantDto: TenantDto){
        const tenantEntity = await this.getTenantById(tenantDto.id)
        if(!tenantEntity){
            return {
                success: false,
                message: "Tenant not found. Update failed."
            }
        }

        tenantEntity.companyName = tenantDto.companyName;
        tenantEntity.fullName = tenantDto.fullName;
        tenantEntity.taxId = tenantDto.taxId;
        tenantEntity.status = tenantDto.status;

        await this.tenantRepository.updateTenant(tenantEntity);
        return {
            success: true,
            message: "Tenant updated successfully."
        };
    }

    async getTenantById(id: number){
        return await this.tenantRepository.getTenantById(id);
    }

    async deleteTenant(tenantDto: TenantDto){
        const tenantEntity = await this.getTenantById(tenantDto.id)
        if(!tenantEntity){
            return {
                success: false,
                message: "Tenant not found. Delete failed."
            }
        }
        await this.tenantRepository.deleteTenant(tenantEntity.id);
        return {
            success: true,
            message: "Tenant deleted successfully."
        };
    }

    async getAllTenants(){
        return await this.tenantRepository.getAllTenants();
    }
}
