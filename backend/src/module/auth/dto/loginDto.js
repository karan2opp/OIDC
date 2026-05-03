import Joi from "joi";
import baseDto from "../../../common/dto/baseDto.js";

class LoginDto extends baseDto {
  static schema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
  });
}

export default LoginDto;
