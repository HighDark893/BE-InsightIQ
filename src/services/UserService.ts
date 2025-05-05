import { UserRepository } from '../repository/user.repository';
import { Logger } from '../utils/Logger';
import { UserEntity } from '../entity/user.entity';
import { UserDto } from '../dto/user.dto';

export class UserService {
  private readonly userRepository = new UserRepository();

  private readonly logger = Logger.getInstance();

  constructor() {}

  async createUserRequest(userDto: UserDto) {
    const userEntity = new UserEntity();
    userEntity.email = userDto.email;
    userEntity.phoneNumber = userDto.phoneNumber;
    userEntity.passwordHash = userDto.password;
    const createdUserEntity = await this.userRepository.createUser(userEntity);

    userDto.id = createdUserEntity.id;

    return userDto;
  }

  async updateUserPassword(userDto: UserDto) {
    const userEntity = await this.userRepository.getUserById(userDto.id);
    if (!userEntity) {
      return {
        success: false,
        message: 'User not found. Password update failed.',
      };
    }
    userEntity.passwordHash = userDto.password;
    await this.userRepository.updateUser(userEntity);
    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }

  async getUserById(id: number) {
    const userEntity = await this.userRepository.getUserById(id);
    if (!userEntity) {
      return null;
    }

    const userDto = new UserDto();

    userDto.id = userEntity.id;
    userDto.email = userEntity.email;
    userDto.phoneNumber = userEntity.phoneNumber;

    return userDto;
  }

  async deleteUser(userDto: UserDto) {
    const userEntity = await this.userRepository.getUserById(userDto.id);
    if (!userEntity) {
      return {
        success: false,
        message: 'User not found. Delete failed.',
      };
    }
    await this.userRepository.deleteUser(userEntity.id);
    return {
      success: true,
      message: 'User deleted successfully.',
    };
  }
}
