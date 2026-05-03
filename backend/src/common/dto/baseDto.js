import Joi from "joi"
import ApiError from "../utils/apiError.js"
class baseDto{
    static schema= Joi.object({})

    static validate(data){
         const {error,value}=this.schema.validate(data,{
            stripUnknown:true,
            abortEarly:false
        
         })
          if(error){
            const errors = error.details.map((d) => d.message)
            return {errors, value: null}
        }
        return {errors: null, value}
    }
}

export default baseDto;