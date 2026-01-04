import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ResawodApi implements ICredentialType {
	name = 'resawodApi';
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

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.resasocial.com',
			url: '/user/login',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Origin': 'https://box.resawod.com',
				'Referer': 'https://box.resawod.com/',
			},
			body: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'jwt_token',
					value: '',
					message: 'Invalid credentials or JWT token not found in response',
				},
			},
		],
	};
}
