import { UserEntity } from '../entity/user.entity';
import { dataSource } from '../config/database.config';

export class UserRepository {
  private readonly userRepository = dataSource.getRepository(UserEntity)

  public async createUser(user: UserEntity){
    return await this.userRepository.save(user)
  }

  public async updateUser(user: UserEntity){
    return await this.userRepository.save(user)
  }

  public async getAllUsers(){
    return await this.userRepository.find()
  }

  public async getUserById(id: number){
    return await this.userRepository.findOne({
      where: { id: id }
    })
  }

  public async deleteUser(id: number){
    return await this.userRepository.delete({ id: id })
  }
}