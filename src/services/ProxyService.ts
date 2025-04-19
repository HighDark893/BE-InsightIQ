import axios from 'axios';
import { env } from '../config/app.config';
import { Logger } from '../utils/Logger';
import { myDataSource } from '../config/database.config';
import { UserEntity } from '../entity/user.entity';
import { UserRepository } from '../repository/user.repository';

export class ProxyService {
    private readonly userRepository = new UserRepository();

    private readonly logger = Logger.getInstance();

    constructor() {

    }

    public async proxyRequest(body: any): Promise<any> {

        const user = new UserEntity();
        user.email = "dangngu01@gmail.com";
        user.phoneNumber = "123456789";
        user.passwordHash = "concacgicungduocc"
        const users = await this.userRepository.save(user);

       return user.email;
    }
}
