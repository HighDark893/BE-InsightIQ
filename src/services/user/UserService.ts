import axios from 'axios';
import { UserRepository } from '../../repository/user.repository';
import { Logger } from '../../utils/Logger';
import { UserEntity } from '../../entity/user.entity';


export class UserService {
  private readonly userRepository = new UserRepository();

  private readonly logger = Logger.getInstance();

  constructor() {

  }

  public async createUserRequest(body: any): Promise<any> {

    const user = new UserEntity();
    user.email = "dangngu01@gmail.com";
    user.phoneNumber = "123456789";
    user.passwordHash = "concacgicungduocc"
    const users = await this.userRepository.save(user);

    return user.email;
  }
}
