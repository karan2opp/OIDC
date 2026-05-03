// module/oidc/clientController.js

import * as clientService from "./clientService.js";
import ApiResponse from "../../common/utils/apiResponse.js";

const registerClient = async (req, res) => {
  const client = await clientService.registerClient(req.body);

  ApiResponse.created(
    res,
    "Client registered successfully",
    client
  );
};

export {
  registerClient,
};



