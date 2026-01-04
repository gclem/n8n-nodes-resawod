import { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class ResawodApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: "file:resawod.svg";
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
    test: ICredentialTestRequest;
}
