import { UserEntity } from '../../entity/user.entity';
import { dataSource } from '../../config/database.config';

export class UserRepository {
  private readonly userRepository = dataSource.getRepository(UserEntity)

  public async createUser(user: UserEntity){
    return await this.userRepository.save(user)
  }
}