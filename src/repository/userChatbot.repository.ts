import { dataSource } from '../config/database.config';
import { UserChatbotEntity } from '../entity/userChatbot.entity';

export class UserChatbotRepository {
  private readonly userChatbotRepository = dataSource.getRepository(UserChatbotEntity)

  public async createUserChatbot(userChatbot: UserChatbotEntity){
    return await this.userChatbotRepository.save(userChatbot)
  }


  public async getAllUserChatbots(){
    return await this.userChatbotRepository.find()
  }

  public async getUserChatbotById(id: number){
    return await this.userChatbotRepository.findOne({
      where: { id: id }
    })
  }

  public async deleteUserChatbot(id: number){
    return await this.userChatbotRepository.delete({ id: id })
  }
}