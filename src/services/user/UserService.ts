import axios from 'axios';
import { UserRepository } from '../../repository/user/user.repository';
import { Logger } from '../../utils/Logger';
import { UserEntity } from '../../entity/user.entity';
import { UserDto } from '../../dto/user/user.dto';


export class UserService {
  private readonly userRepository = new UserRepository();

  private readonly logger = Logger.getInstance();

  constructor() {

  }

  async createUserRequest(userDto: UserDto){

    const userEntity = new UserEntity();
    userEntity.email = userDto.email;
    userEntity.phoneNumber = userDto.phoneNumber;
    userEntity.passwordHash = userDto.passwordHash;
    await this.userRepository.createUser(userEntity);
  }
}
