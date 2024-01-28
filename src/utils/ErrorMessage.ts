import { ErrorResponse } from '@bsr-comms/utils';

const ErrorMessage: Record<ErrorResponse['code'], string> = {
    MaxUsers: 'The maximum number of users have already joined the channel.',
    UsernameInvalid: 'User name is invalid.',
    UsernameUnavailable: 'User name is unavailable.',
};

export default ErrorMessage;
