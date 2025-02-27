import type { PostConfirmationTriggerHandler } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient();

// add user to group
export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log(event);
  const command = new AdminAddUserToGroupCommand({
    GroupName: event.request.userAttributes["custom:group"],
    Username: event.userName,
    UserPoolId: event.userPoolId,
  });
  const response = await client.send(command);
  console.log("processed", response.$metadata.requestId);
  return event;
};
