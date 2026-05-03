import Joi from "joi";
import baseDto from "../../../common/dto/baseDto.js";

class registerDto extends baseDto{
  static schema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().max(340).lowercase().required(),
    password: Joi.string()
      .min(8)
      .pattern(/(?=.*[A-Z])(?=.*\d)/)
      .message(
        "Password must contain at least one uppercase letter and one digit",
      )
      .required(),
    role: Joi.string().valid("customer", "seller").default("customer"),
  });

}
export default registerDto;