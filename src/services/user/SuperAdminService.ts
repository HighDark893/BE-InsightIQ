import axios from 'axios';
import { Logger } from '../../utils/Logger';
import { SuperAdminEntity } from "../../entity/superadmin.entity";
import {SuperAdminDto} from "../../dto/user/superadmin.dto";
import {SuperAdminRepository} from "../../repository/user/superadmin.repository";


export class SuperAdminService {
    private readonly superAdminRepository = new SuperAdminRepository();

    private readonly logger = Logger.getInstance();

    constructor() {

    }

    async createSuperAdminRequest(superAdminDto: SuperAdminDto){

        const superAdminEntity = new SuperAdminEntity();
        superAdminEntity.username = superAdminDto.username;
        await this.superAdminRepository.createSuperAdmin(superAdminEntity);
    }
}
