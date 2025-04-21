import { UserEntity } from '../entity/user.entity';
import { myDataSource } from '../config/database.config';

export class UserRepository {
  private readonly userRepository = myDataSource.getRepository(UserEntity)

  public async createUser(user: UserEntity){
    return await this.userRepository.save(user)
  }
}