"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResawodApi = void 0;
const ResawodApiService_1 = require("../services/ResawodApiService");
class ResawodApi {
    constructor() {
        this.name = 'resawodApi';
        this.icon = 'file:resawod.svg';
        this.displayName = 'Resawod API';
        this.documentationUrl = 'https://github.com/loulasedna/Resawod_nubapp';
        this.properties = [
            {
                displayName: 'Username',
                name: 'username',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Password',
                name: 'password',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
            },
            {
                displayName: 'Application ID',
                name: 'applicationId',
                type: 'string',
                default: '',
                description: 'The ID of the application (e.g. 74239463)',
            },
            {
                displayName: 'Category Activity ID',
                name: 'categoryActivityId',
                type: 'string',
                default: '',
                description: 'The ID of the category activity (e.g. 2179)',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '={{$credentials.token}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: ResawodApiService_1.RESASOCIAL_BASE_URL,
                url: ResawodApiService_1.LOGIN_ENDPOINT,
                method: ResawodApiService_1.LOGIN_METHOD,
                body: {
                    username: '={{$credentials.username}}',
                    password: '={{$credentials.password}}',
                },
            },
        };
    }
}
exports.ResawodApi = ResawodApi;
//# sourceMappingURL=ResawodApi.credentials.js.map