import {
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class Resawod implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Resawod',
		name: 'resawod',
		icon: 'file:resawod.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Resawod API',
		documentationUrl: 'https://github.com/loulasedna/Resawod_nubapp',
		defaults: {
			name: 'Resawod',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'resawodApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Slot',
						value: 'slot',
					},
					{
						name: 'Booking',
						value: 'booking',
					},
				],
				default: 'slot',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'slot',
						],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many slots',
						description: 'Get available slots',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'booking',
						],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a booking',
						description: 'Book a slot',
					},
					{
						name: 'Get Future Booking',
						value: 'getFutureBooking',
						action: 'Get future bookings',
						description: 'Get future bookings for the user',
					},
				],
				default: 'create',
			},
			// Slot: Get All Properties
			{
				displayName: 'Start Date',
				name: 'start',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						resource: ['slot'],
						operation: ['getAll'],
					},
				},
				required: true,
				description: 'Start date for the search',
			},
			{
				displayName: 'End Date',
				name: 'end',
				type: 'dateTime',
				default: '',
				displayOptions: {
					show: {
						resource: ['slot'],
						operation: ['getAll'],
					},
				},
				required: true,
				description: 'End date for the search',
			},
			// Booking: Create Properties
			{
				displayName: 'Activity Calendar ID',
				name: 'activityCalendarId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['booking'],
						operation: ['create'],
					},
				},
				required: true,
				description: 'The ID of the activity calendar to book',
			},
			// Booking: Get Future Properties
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				displayOptions: {
					show: {
						resource: ['booking'],
						operation: ['getFutureBooking'],
					},
				},
				description: 'Max number of results to return',
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('resawodApi');
		const username = credentials.username as string;
		const password = credentials.password as string;
		const applicationId = credentials.applicationId as string;
		const categoryActivityId = credentials.categoryActivityId as string;

		// Helper function to encode form data
		const encodeFormData = (data: Record<string, string | number>): string => {
			return Object.entries(data)
				.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
				.join('&');
		};

		// --- Helper: Login and get token ---
		const login = async () => {
			// Step 1: Login to Resasocial to get JWT Token
			const loginOptions: IHttpRequestOptions = {
				method: 'POST',
				url: 'https://api.resasocial.com/user/login',
				body: {
					username: username,
					password: password,
				},
				headers: {
					'Content-Type': 'application/json',
					'Origin': 'https://box.resawod.com',
					'Referer': 'https://box.resawod.com/',
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'X-Requested-With': 'XMLHttpRequest',
				},
				json: true,
			};

			const loginResponse = await this.helpers.httpRequest(loginOptions) as { 
				jwt_token: string; 
				applications?: Array<{ id_application: string; id_user: string }>;
				id_user?: string;
			};
			
			const resasocialToken = loginResponse.jwt_token;
			
			if (!resasocialToken) {
				throw new NodeOperationError(this.getNode(), 'Could not find jwt_token in login response');
			}

			// Extract id_user from login response
			let idUser: string | undefined;
			if (loginResponse.applications && Array.isArray(loginResponse.applications)) {
				const app = loginResponse.applications.find((a) => a.id_application === applicationId);
				if (app) {
					idUser = app.id_user;
				}
			}
			
			// Fallback to direct id_user if available
			if (!idUser && loginResponse.id_user) {
				idUser = loginResponse.id_user;
			}

			if (!idUser) {
				throw new NodeOperationError(this.getNode(), 'Could not find user ID in login response');
			}

			// Step 2: Get Sport User Token (Nubapp JWT)
			const sportTokenOptions: IHttpRequestOptions = {
				method: 'GET',
				url: `https://api.resasocial.com/secure/user/getSportUserToken?id_user=${idUser}&id_application=${applicationId}`,
				headers: {
					'Authorization': `Bearer ${resasocialToken}`,
					'Origin': 'https://box.resawod.com',
					'Referer': 'https://box.resawod.com/',
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				},
				json: true,
			};

			const sportTokenResponse = await this.helpers.httpRequest(sportTokenOptions) as { jwt_token: string };
			const nubappToken = sportTokenResponse.jwt_token;

			if (!nubappToken) {
				throw new NodeOperationError(this.getNode(), 'Could not get Nubapp token from getSportUserToken');
			}

			return {
				nubappToken: nubappToken,
				idUser: idUser,
			};
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const { nubappToken, idUser: userIdFromLogin } = await login();

				if (resource === 'slot') {
					if (operation === 'getAll') {
						const start = this.getNodeParameter('start', i) as string;
						const end = this.getNodeParameter('end', i) as string;
						
						// Format dates as DD-MM-YYYY
						const formatDate = (dateStr: string): string => {
							const date = new Date(dateStr);
							const day = String(date.getDate()).padStart(2, '0');
							const month = String(date.getMonth() + 1).padStart(2, '0');
							const year = date.getFullYear();
							return `${day}-${month}-${year}`;
						};

						const startFormatted = formatDate(start);
						const endFormatted = formatDate(end);

						const options: IHttpRequestOptions = {
							method: 'POST',
							url: 'https://sport.nubapp.com/api/v4/activities/getActivitiesCalendar.php',
							body: encodeFormData({
								app_version: '5.12.03',
								id_application: applicationId,
								start_timestamp: startFormatted,
								end_timestamp: endFormatted,
								id_user: userIdFromLogin,
								id_category_activity: categoryActivityId,
							}),
							headers: {
								'Authorization': `Bearer ${nubappToken}`,
								'Content-Type': 'application/x-www-form-urlencoded',
								'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
								'nubapp-origin': 'user_apps',
								'Origin': 'https://box.resawod.com',
								'Referer': 'https://box.resawod.com/',
							},
							returnFullResponse: false,
						};

						const responseRaw = await this.helpers.httpRequest(options);
						const response = typeof responseRaw === 'string' ? JSON.parse(responseRaw) : responseRaw;
						returnData.push({ json: response });
					}
				} else if (resource === 'booking') {
					if (operation === 'create') {
						// TODO: Find correct v4 endpoint for booking
						throw new NodeOperationError(this.getNode(), 'Booking creation is currently not supported in v4 API', { itemIndex: i });
					} else if (operation === 'getFutureBooking') {
						const limit = this.getNodeParameter('limit', i) as number;
						
						// Use id_user from login response
						const idUser = userIdFromLogin;

						if (!idUser) {
							throw new NodeOperationError(this.getNode(), 'Could not find user ID in login response', { itemIndex: i });
						}

						const options: IHttpRequestOptions = {
							method: 'POST',
							url: 'https://sport.nubapp.com/api/v4/users/getUserFutureBookings.php',
							body: encodeFormData({
								app_version: '5.12.03',
								id_application: applicationId,
								id_user: idUser,
								limit: limit,
								include_waiting_list: 'true',
							}),
							headers: {							'Authorization': `Bearer ${nubappToken}`,								'Content-Type': 'application/x-www-form-urlencoded',
								'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
								'nubapp-origin': 'user_apps',
								'Origin': 'https://box.resawod.com',
								'Referer': 'https://box.resawod.com/',
							},
							returnFullResponse: false,
						};

						const responseRaw = await this.helpers.httpRequest(options);
						const response = typeof responseRaw === 'string' ? JSON.parse(responseRaw) : responseRaw;
						returnData.push({ json: response });
					}
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error);
			}
		}
		return [returnData];
	}
}
