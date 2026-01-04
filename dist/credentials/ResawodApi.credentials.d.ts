import { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class ResawodApi implements ICredentialType {
    name: string;
    icon: "file:resawod.svg";
    displayName: string;
    documentationUrl: string;
    properties: INodeProperties[];
    authenticate: IAuthenticateGeneric;
    test: {
        request: {
            baseURL: string;
            url: string;
            method: import("n8n-workflow").IHttpRequestMethods;
            body: {
                username: string;
                password: string;
            };
        };
    };
}
