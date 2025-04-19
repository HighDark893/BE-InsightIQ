import { UserEntity } from '../entity/user.entity';

export class UserDto {
  email: string;
  id: number;
  phone: string;
  public static fromEntity(entity: UserEntity) {
    const userDto = new UserDto();
    userDto.email = entity.email;
    userDto.id = entity.id;
    userDto.phone = entity.phoneNumber;
    return userDto;
  }
}
