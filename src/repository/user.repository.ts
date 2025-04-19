import { UserEntity } from '../entity/user.entity';
import { myDataSource } from '../config/database.config';
import { UserDto } from '../dto/user.dto';

export class UserRepository {
  private readonly userRepository = myDataSource.getRepository(UserEntity)

  public async save(user: UserEntity): Promise<UserDto>{
    return UserDto.fromEntity(await this.userRepository.save(user))
  }
}