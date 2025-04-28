import { dataSource } from '../../config/database.config';
import {SuperAdminEntity} from "../../entity/superadmin.entity";

export class SuperAdminRepository {
    private readonly superAdminRepository = dataSource.getRepository(SuperAdminEntity)

    public async createSuperAdmin(superadmin: SuperAdminEntity){
        return await this.superAdminRepository.save(superadmin)
    }
}