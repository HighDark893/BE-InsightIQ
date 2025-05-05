import { Logger } from '../utils/Logger';
import { UserChatbotRepository } from '../repository/userChatbot.repository';
import { UserChatbotDto } from '../dto/userChatbot.dto';
import { UserChatbotEntity } from '../entity/userChatbot.entity';
import { TenantRepository } from '../repository/tenant.repository';
import { UserRepository } from '../repository/user.repository';


export class UserChatbotService {
  private readonly userChatbotRepository = new UserChatbotRepository();
  private readonly tenantRepository = new TenantRepository();
  private readonly userRepository = new UserRepository();

  private readonly logger = Logger.getInstance();

  constructor() {

  }

  async createUserChatbotRequest(userChatbotDto: UserChatbotDto){

    const userChatbotEntity = new UserChatbotEntity();

    const tenantEntity = await this.tenantRepository.getTenantById(userChatbotDto.tenantId);
    if (!tenantEntity) {
      return null;
    }

    const userEntity = await this.userRepository.getUserById(userChatbotDto.userId);
    if (!userEntity) {
      return null;
    }

    userChatbotEntity.name = userChatbotDto.name;
    userChatbotEntity.user = userEntity;
    userChatbotEntity.tenant = tenantEntity;

    const createdUserChatbotEntity = await this.userChatbotRepository.createUserChatbot(userChatbotEntity);

    userChatbotDto.id = createdUserChatbotEntity.id;

    return userChatbotDto;
  }

  async getUserChatbotById(id: number){
    const userChatbotEntity = await this.userChatbotRepository.getUserChatbotById(id);
    if(!userChatbotEntity){
      return null;
    }

    const userChatbotDto = new UserChatbotDto();

    userChatbotDto.id = userChatbotEntity.id;

    return userChatbotDto;
  }

  async deleteUserChatbot(userChatbotDto: UserChatbotDto){
    const userChatbotEntity = await this.userChatbotRepository.getUserChatbotById(userChatbotDto.id)
    if(!userChatbotEntity){
      return {
        success: false,
        message: "User chatbot not found. Delete failed."
      }
    }
    await this.userChatbotRepository.deleteUserChatbot(userChatbotEntity.id);
    return {
      success: true,
      message: "User chatbot deleted successfully."
    };
  }



}
