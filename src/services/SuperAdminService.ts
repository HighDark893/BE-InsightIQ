import { Logger } from '../utils/Logger';
import { SuperAdminEntity } from "../entity/superadmin.entity";
import {SuperAdminDto} from "../dto/superadmin.dto";
import {SuperAdminRepository} from "../repository/superadmin.repository";


export class SuperAdminService {
    private readonly superAdminRepository = new SuperAdminRepository();

    private readonly logger = Logger.getInstance();

    constructor() {

    }

    async createSuperAdminRequest(superAdminDto: SuperAdminDto){

        const superAdminEntity = new SuperAdminEntity();
        superAdminEntity.username = superAdminDto.username;
        superAdminEntity.user.id = superAdminDto.userId;
        await this.superAdminRepository.createSuperAdmin(superAdminEntity);
    }

    async updateSuperAdmin(superAdminDto: SuperAdminDto){
        const superAdminEntity = await this.superAdminRepository.getSuperAdminById(superAdminDto.id)
        if(!superAdminEntity){
            return {
                success: false,
                message: "Super admin not found. Update failed."
            }
        }

        superAdminEntity.username = superAdminDto.username;

        await this.superAdminRepository.updateSuperAdmin(superAdminEntity);
        return {
            success: true,
            message: "Super admin updated successfully."
        };
    }

    async getSuperAdminById(id: number){
        return await this.superAdminRepository.getSuperAdminById(id);
    }
}
