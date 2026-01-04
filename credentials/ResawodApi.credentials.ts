import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';
import { 
	RESASOCIAL_BASE_URL,
	LOGIN_ENDPOINT,
	LOGIN_METHOD,
} from '../services/ResawodApiService';

export class ResawodApi implements ICredentialType {
	name = 'resawodApi';

	icon = 'file:resawod.svg' as const;
	displayName = 'Resawod API';
	documentationUrl = 'https://github.com/loulasedna/Resawod_nubapp';
	
	properties: INodeProperties[] = [
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

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.token}}',
			},
		},
	};

	test = {
		request: {
			baseURL: RESASOCIAL_BASE_URL,
			url: LOGIN_ENDPOINT,
			method: LOGIN_METHOD,
			body: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};
}
